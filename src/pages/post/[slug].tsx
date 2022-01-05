// next
import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
// prismic
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
// othes libs
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'
// components
import Header from '../../components/Header'
import { Comments } from '../../components/Comments'
import { ExitPreviewMode } from '../../components/ExitPreviewMode';
// styles
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
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
  post: Post,
  prevPost: Post,
  nextPost: Post,
  preview: boolean;
}

export default function Post({ post, preview, prevPost, nextPost }: PostProps) {

  // declareando variaveis usadas na função
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className={styles.loading}>
        <img src={'/images/loading.svg'} />
        <p> Carregando... </p>
      </div>
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

  const tempoLeitura = calcularTempoLeitura();

  console.log('__PREV_POST__', prevPost);
  console.log('__NEXT_POST__', nextPost);

  return (
    <>
      <Header />
      {
        post.data.banner.url ? (
          <img src={post.data.banner.url} className={styles.banner} alt='banner' />
        ) : ''
      }
      <main className={`${commonStyles.pageSize}`}>
        <h1 className={styles.title}>{post.data.title}</h1>
        <section className={styles.info}>
          <FiCalendar />
          <time>
            {
              format(new Date(post.first_publication_date),
                'dd MMM yyyy',
                {
                  locale: ptBR
                }
              )
            }
          </time>
          <FiUser />
          <span>{post.data.author}</span>
          <FiClock />
          <span>{`${tempoLeitura} min`}</span>
          { // data em que o post foi editado
            (post.last_publication_date && post.last_publication_date != post.first_publication_date) ? (
              <p>
                {
                  format(new Date(post.last_publication_date),
                    "'* editado em 'dd MMM yyyy ', ás 'HH:mm",
                    {
                      locale: ptBR
                    })
                }
              </p>
            ) : ''
          }
        </section>
        <section className={styles.content}>
          {
            post.data.content.map((cur, ind) => (
              <article key={ind}>
                {
                  cur.heading ? <h2>{cur.heading}</h2> : ''
                }
                <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(cur.body) }} />
              </article>
            ))
          }
        </section>
      </main>
      <footer className={commonStyles.pageSize}>
        <div className={styles.divider} />
        <div className={styles.postNavigation}>
          {
            prevPost ? (
              <Link href={`/post/${prevPost.uid}`}>
                <a className={styles.prev}>
                  <p>
                    {
                      prevPost.data?.title.substring(0, Math.min(prevPost.data.title.length, 30)).trim() || ''
                    }
                    {
                      (prevPost.data.title && prevPost.data.title.length > 30) ? '...' : ''
                    }
                  </p>
                  <span> Post Anterior </span>
                </a>
              </Link>
            ) : ''
          }
          {
            nextPost ? (
              <Link href={`/post/${nextPost.uid}`}>
                <a className={styles.next}>
                  <p>
                    {
                      nextPost.data?.title.substring(0, Math.min(nextPost.data.title.length, 30)).trim() || ''
                    }
                    {
                      (nextPost.data.title && nextPost.data.title.length > 30) ? '...' : ''
                    }
                  </p>
                  <span> Próximo Post</span>
                </a>
              </Link>
            ) : ''
          }
        </div>
        <Comments className={styles.comments} />
        {
          preview ? <ExitPreviewMode className={styles.exitPreview} /> : ''
        }
      </footer>
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
      pageSize: 3
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

export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {

  // definido o intervalo e mque o next vai recriar as páginas
  const revalidate = 60;

  try {
    // montando o objeto cliente do prismic 
    const prismic = getPrismicClient();
    // carregando o post que foi passado pela url da pagina
    const post = await prismic.getByUID('posts', String(params.slug), { ref: previewData?.ref ?? null });

    const prevPost = (await prismic.query(
      Prismic.predicates.at('document.type', 'posts'),
      {
        pageSize: 1,
        after: `${post.id}`,
        orderings: '[document.first_publication_date desc]'
      }
    ))?.results[0] || null;

    const nextPost = (await prismic.query(
      Prismic.predicates.at('document.type', 'posts'),
      {
        pageSize: 1,
        after: `${post.id}`,
        orderings: '[document.first_publication_date]'
      }
    ))?.results[0] || null;

    // retornando os dados para a pagina
    return {
      props: {
        post,
        prevPost,
        nextPost,
        preview
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