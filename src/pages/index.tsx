// react 
import { useState } from 'react';
// next
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
// prismic 
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
// othes
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';
// styles
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';


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
            new Date(post.first_publication_date),
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
      <Head>
        <title>Home - MyBlog</title>
      </Head>
      <header className={`${styles.header} ${commonStyles.pageSize}`}>
        <img src='/images/logo.svg' alt='logo' />
      </header>
      <main className={`${styles.mainContainer} ${commonStyles.pageSize}`}>
        {
          posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={styles.post}>
                <h3>{post.data.title}</h3>
                <p>{post.data.subtitle}</p>
                <div>
                  <FiCalendar />
                  <time>
                    {
                      format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR
                        }
                      )
                    }
                  </time>
                  <FiUser />
                  <span>{post.data.author}</span>
                </div>
              </a>
            </Link>
          ))
        }
        {
          nextPage ? (
            <button className={styles.nextPageButton} onClick={loadNextPageHandle}>
              Carregar mais posts
            </button>
          ) : ''
        }
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {

  // cria um novo cliente prismic
  const prismic = getPrismicClient();

  // carrega o titulo e o conteudo de todos os documentos do tipo posts
  const response = await prismic.query(
    [
      Prismic.predicates.at('document.type', 'posts'),
    ],
    {
      orderings: '[document.first_publication_date desc]',
      pageSize: 3
    }
  );

  // // cria uma lista com os posts já tipados
  // const posts = response.results.map(post => {
  //   return {
  //     uid: post.uid,
  //     first_publication_date: format(
  //       new Date(post.first_publication_date),
  //       'dd MMM yyyy',
  //       {
  //         locale: ptBR
  //       }
  //     ),
  //     data: {
  //       title: post.data.title,
  //       subtitle: post.data.subtitle,
  //       author: post.data.author,
  //     }
  //   } as Post
  // });

  // retorna as propriedades para a função que vai construir a página
  return {
    props: {
      // postsPagination: {
      //   results: posts,
      //   next_page: response.next_page,
      // }
      postsPagination: response
    },
    // informar ao next que a pagina precisa ser regerada a cada 60 segundos
    revalidate: 60, // Segundos 
  }

};  