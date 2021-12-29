import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Header from '../../components/Header'

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

  return (
    <>
      <Header />
      <main className={commonStyles.pageSize}>
        <img src={post.data.banner.url} alt='banner' />
        <h1>{post.data.title}</h1>
        <div>
          <time>{post.first_publication_date}</time>
          <span>{post.data.author}</span>
          <span>{'15 Min'}</span>
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
  // const prismic = getPrismicClient();
  // const posts = await prismic.query(TODO);
  return {
    paths: [],
    fallback: 'blocking'
  }
  // // TODO
};

export const getStaticProps: GetStaticProps = async ({ params }) => {

  const revalidate = 60;

  try {

    const prismic = getPrismicClient();

    const res = await prismic.getByUID('posts', String(params.slug), {});

    return {
      props: {
        post: res
      },
      revalidate
    };

  } catch (err) {

    console.log(err);

    return {
      revalidate,
      notFound: true
    };

  }

};