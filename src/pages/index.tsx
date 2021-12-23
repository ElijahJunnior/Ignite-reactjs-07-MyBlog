// react 
import { GetStaticProps } from 'next';
// prismic 
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
// othes
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
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

  // const teste2 = await fetch(teste.next_page).then(response => response.json());

  return (

    <>
      <ul>
        {
          props.postsPagination.results.map(post => (
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
      <button>
        Carregar mais posts
      </button>
    </>

  )

}

export const getStaticProps: GetStaticProps = async () => {

  const prismic = getPrismicClient();
  const response = await prismic.query(
    [
      Prismic.predicates.at('document.type', 'posts')
    ],
    {
      fetch: ['publication.title', 'publication.content'],
      pageSize: 4
    }
  );

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

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: response.next_page,
      } as PostPagination
    } as HomeProps,
    revalidate: 60,
  }

};