import Prismic from '@prismicio/client';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import ptBr from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';
import Comments from '../../components/Comments';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
  previousPost?: Post;
  nextPost?: Post;
}

export default function Post({
  post,
  preview,
  previousPost,
  nextPost,
}: PostProps): JSX.Element {
  const router = useRouter();
  const readingTime = post?.data.content.reduce((acc, content) => {
    const text = `${content.heading} ${RichText.asText(content.body)}`;

    acc += Math.ceil(text.split(' ').length / 200);

    return acc;
  }, 0);

  if (router.isFallback)
    return <h1 className={styles.loading}>Carregando...</h1>;

  return (
    <div className={styles.container}>
      <header>
        <Header />
      </header>
      <figure>
        <img src={post?.data.banner.url} alt="banner" />
      </figure>
      <div className={styles.post}>
        <article>
          <h1>{post?.data.title}</h1>
          <div className={commonStyles.postDescription}>
            {!preview && (
              <span>
                <FiCalendar />
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBr,
                })}
              </span>
            )}
            <span>
              <FiUser />
              {post?.data.author}
            </span>
            <time>
              <FiClock /> {readingTime} min
            </time>
          </div>

          {post?.last_publication_date && (
            <small className={styles.edited}>
              * editado em{' '}
              {format(
                parseISO(post?.last_publication_date),
                "dd MMM yyyy, 'às' hh:mm"
              ).toLowerCase()}
            </small>
          )}

          {post?.data?.content.map((content, index) => (
            <div key={String(index)}>
              <h2>{content.heading}</h2>
              <div
                className={styles.content}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </article>

        <footer className={styles.pagination}>
          {previousPost && (
            <Link href={`/post/${previousPost.uid}`}>
              <a>
                <strong>{previousPost.data.title}</strong>
                <small>Post anterior</small>
              </a>
            </Link>
          )}

          {nextPost && (
            <Link href={`/post/${nextPost.uid}`}>
              <a>
                <strong>{nextPost.data.title}</strong>
                <small>Próximo post</small>
              </a>
            </Link>
          )}
        </footer>

        <Comments />

        {preview && (
          <Link href="/api/exit-preview">
            <a className={commonStyles.previewButton}>Sair do movo Preview</a>
          </Link>
        )}
      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.slug'],
      pageSize: 1,
    }
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const previousPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: String(response.id),
      orderings: '[document.first_publication_date desc]',
    }
  );

  const nextPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 10,
      after: String(response.id),
      orderings: '[document.first_publication_date]',
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      preview,
      previousPost: previousPost.results.length
        ? previousPost.results[0]
        : null,
      nextPost: nextPost.results.length ? nextPost.results[0] : null,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
