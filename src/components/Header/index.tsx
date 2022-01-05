import Link from 'next/link';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={styles.headerContainer}>
      <Link href="/">
        <a>
          <div className={styles.headerContent}>
            <img src="/images/logo.svg" alt="logo" />
          </div>
        </a>
      </Link>
    </header>
  );
}
