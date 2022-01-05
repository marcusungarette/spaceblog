import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { format } from 'date-fns';
import { FaUser, FaRegCalendar } from 'react-icons/fa';

import PrismicDom from 'prismic-dom';
import Prismic from '@prismicio/client';

import { useState } from 'react';
import styles from './home.module.scss';
import commonStyles from '../styles/common.module.scss';
import { getPrismicClient } from '../services/prismic';

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

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { results, next_page } = postsPagination;
  const [posts, setNewPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  async function loadNewPosts(): Promise<void> {
    const data = await fetch(nextPage).then(response => response.json());
    const post = data.results[0];

    if (data.next_page) {
      setNextPage(data.next_page);
    } else {
      setNextPage(null);
    }

    const loadedPosts = {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };

    setNewPosts([...posts, loadedPosts]);
  }

  return (
    <>
      <Head>
        <title>Spacetraveling | Home</title>
      </Head>
      <main className={commonStyles.container}>
        <div className={styles.post}>
          {posts.map(post => (
            <Link key={post.uid} href={`/posts/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <time>
                  <FaRegCalendar />
                  {post.first_publication_date}
                </time>
                <span>
                  <FaUser /> {post.data.author}
                </span>
              </a>
            </Link>
          ))}
        </div>
        <button type="button" onClick={loadNewPosts}>
          {nextPage ? 'Carregar mais posts' : ''}
        </button>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author', 'post.banner'],
      pageSize: 20,
    }
  );

  // console.log(JSON.stringify(response, null, 2));
  const { next_page } = response;

  const results = response.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: PrismicDom.RichText.asText(post.data.title),
        subtitle: PrismicDom.RichText.asText(post.data.subtitle),
        author: PrismicDom.RichText.asText(post.data.author),
      },
      first_publication_date: format(
        new Date(post.first_publication_date),
        'd MMM yyyy'
      ),
    };
  });

  const postsPagination = {
    next_page,
    results,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
