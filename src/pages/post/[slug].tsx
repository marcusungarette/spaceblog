import { GetStaticPaths, GetStaticProps } from 'next';

import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';

import Prismic from '@prismicio/client';
import {
  FiCalendar as Calendar,
  FiUser as User,
  FiClock as Clock,
} from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    subtitle: string;
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

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const amountWords = post.data.content.reduce((acumulador, content) => {
    const words = RichText.asText(content.body).split(' ').length;

    return acumulador + words;
  }, 0);

  const readingTime = Math.ceil(amountWords / 200);

  return (
    <>
      <main className={commonStyles.page}>
        <img
          src={post.data.banner.url}
          className={styles.banner}
          alt="banner"
        />
        <section className={commonStyles.pageContent}>
          <h1 className={styles.postTitle}>{post.data.title}</h1>
          <span className={commonStyles.postInformation}>
            <span>
              <Calendar size={20} />{' '}
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}{' '}
            </span>
            <span>
              <User size={20} />
              {post.data.author}
            </span>
            <span>
              <Clock size={20} />
              {readingTime} min
            </span>
          </span>
          {post.data.content.map((p, index) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <article key={index} className={styles.postArticle}>
                <h3>{p.heading}</h3>
                <p
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: RichText.asHtml(p.body) }}
                />
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 100,
    }
  );

  return {
    paths: posts.results.map(post => ({
      params: { slug: post.uid },
    })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24, // 24 horas
  };
};
