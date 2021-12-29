// next
import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';
// prismic
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
// othes libs
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
// components
import Header from '../../components/Header'
// styles
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {

  // declareando variaveis usadas na função
  const router = useRouter();

  if (router.isFallback) {
    return (
      <p> Carregando </p>
    )
  }

  function calcularTempoLeitura() {

    // conta a quantidade de palavras do post
    const wordCount = post.data.content.reduce((acc, cur) => {
      // converte o conteudo do body em texto
      const bodyText = RichText.asText(cur.body);
      // soma ao acc a quantidade de palavras do body, caso ele tenha conteudo
      if (bodyText) {
        acc += bodyText.trim().split(/\s+/)?.length || 0;
      }
      // soma ao acc a quantidade de palavras do heading, caso ele tenha conteudo
      if (cur.heading) {
        acc += cur.heading.trim().split(/\s+/)?.length || 0;
      }
      // retorno o acumulador
      return acc;

    }, 0)

    // retorna o tempo de leitura
    // tempo de leitura = qtd de palavras / qtd média de palavras lidas por minuto
    return Math.ceil(wordCount / 200);

  }

  const tempoLeitura = calcularTempoLeitura()

  return (
    <>
      <Header />
      <main className={commonStyles.pageSize}>
        <img src={post.data.banner.url} alt='banner' />
        <h1>{post.data.title}</h1>
        <div>
          <time>{post.first_publication_date}</time>
          <span>{post.data.author}</span>
          <span>{`${tempoLeitura} min`}</span>
        </div>
        {
          post.data.content.map((cur, ind) => (
            <div key={ind}>
              {cur.heading ? <h2>{cur.heading}</h2> : ''}
              <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(cur.body) }} />
            </div>
          ))
        }
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  // criando instancia do cliente do prismic
  const prismic = getPrismicClient();
  // carregando 4 posts ordenando por primeira da de publicação decrescente
  const posts = await prismic.query(
    [
      Prismic.predicates.at('document.type', 'posts')
    ],
    {
      orderings: '[document.first_publication_date desc]',
      pageSize: 4
    }
  );
  // montando objeto paths para o Next renderizar as paths no momento do build 
  const paths = posts.results?.map(cur => {
    return {
      params: {
        slug: cur.uid
      }
    }
  }) || [];
  // retonando os parametros de renderização de paginas estaticas para o next 
  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {

  // definido o intervalo e mque o next vai recriar as páginas
  const revalidate = 60;

  try {
    // montando o objeto cliente do prismic 
    const prismic = getPrismicClient();
    // carregando o post que foi passado pela url da pagina
    const res = await prismic.getByUID('posts', String(params.slug), {});

    for (let int = 0; int < 20000; int++) {
      const element = 'elias'
    }

    // retornando os dados para a pagina
    return {
      props: {
        post: res
      },
      revalidate
    };

  } catch (err) {
    // logando o erro
    console.log(err);
    // retornando pagina 404 para o usuario 
    return {
      notFound: true,
      revalidate,
    };

  }

};