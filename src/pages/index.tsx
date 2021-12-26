// react 
import next, { GetStaticProps } from 'next';
import { useState } from 'react';
// prismic 
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
// othes
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
// styles
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import ResolvedApi from '@prismicio/client/types/ResolvedApi';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home(props: HomeProps) {

  // Criando estados com os parametros recebidos por GetStaticProps
  const [posts, setPosts] = useState<Post[]>(props.postsPagination?.results || []);
  const [nextPage, setNextPage] = useState<string>(props.postsPagination.next_page || '');

  // Função responsavel por carregar os dados da proxima página do api do prismic
  async function loadNextPageHandle() {

    try {

      // verifica se existe uma próxima página para ser carregada
      if (!nextPage) { return; }

      // executa o consumo para pegar os dados da próxima pagina
      const response = await fetch(nextPage).then(response => response.json());

      // cria uma variavel com os posts da próxima pagina já formatados
      const postsLoaded = response.results?.map(post => {
        return {
          uid: post.uid,
          first_publication_date: format(
            new Date(post.last_publication_date),
            'dd MMM yyyy',
            {
              locale: ptBR
            }
          ),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          }
        } as Post
      });

      // atualiza o state adcionando os novos posts
      setPosts([...posts, ...postsLoaded]);

      // atualiza o state com o novo link de próxima página
      setNextPage(response?.next_page || '');

    } catch (err) {

      console.log(err);

    }

  }

  return (

    <>
      <ul>
        {
          posts.map(post => (
            <li key={post.uid}>
              <h3>{post.data.title}</h3>
              <p>{post.data.subtitle}</p>
              <div>
                <img src='/images/calendar.svg' />
                <span>{post.first_publication_date}</span>
                <img src='/images/user.svg' /> <span>{post.data.author}</span>
              </div>
            </li>
          ))
        }
      </ul>
      {
        nextPage ? (
          <button onClick={loadNextPageHandle}>
            Carregar mais posts
          </button>
        ) : ''
      }
    </>

  )

}

export const getStaticProps: GetStaticProps = async () => {

  // cria um novo cliente prismic
  const prismic = getPrismicClient();

  // carrega o titulo e o conteudo de todos os documentos do tipo posts
  const response = await prismic.query(
    [
      Prismic.predicates.at('document.type', 'posts')
    ],
    {
      fetch: ['publication.title', 'publication.content'],
      pageSize: 2
    }
  );

  // cria uma lista com os posts já tipados
  const posts = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.last_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    } as Post
  });

  // retorna as propriedades para a função que vai construir a página
  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: response.next_page,
      } as PostPagination
    } as HomeProps,
    // informar ao next que a pagina precisa ser regerada a cada 60 segundos
    revalidate: 60, // Segundos 
  }

};