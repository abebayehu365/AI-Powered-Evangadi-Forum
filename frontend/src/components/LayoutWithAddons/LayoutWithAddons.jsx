import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NavbarWithAddons from '../NavbarWithAddons/NavbarWithAddons.jsx';
import SidebarWithAddons from '../SidebarWithAddons/SidebarWithAddons.jsx';
import SupportBot from '../SupportBot/SupportBot.jsx';
import styles from './LayoutWithAddons.module.css';

/**
 * LayoutWithAddons:
 * Main layout shell with Sidebar, Navbar, global SupportBot, and route titles.
 */
export default function LayoutWithAddons() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Home';
    if (path === '/my-questions') return 'Your topics';
    if (path === '/questions/ask') return 'Ask a question';
    if (path.startsWith('/question/') || path.startsWith('/questions/')) return 'Discussion';
    if (path === '/rag-documents') return 'Knowledge base';
    if (path.startsWith('/profile')) return 'Learner Profile';
    return 'Forum';
  };

  const getSubtitle = () => {
    const path = location.pathname;
    if (path === '/dashboard')
      return 'Browse the feed, search by keyword, or run AI similarity search.';
    if (path === '/my-questions')
      return 'Questions you have posted. Open any thread to read replies or edit context.';
    if (path === '/questions/ask')
      return 'A clear title and reproducible steps get faster, more accurate answers.';
    if (path.startsWith('/question/') || path.startsWith('/questions/'))
      return 'Read the thread, review related topics, rate answers, or contribute your own.';
    if (path === '/rag-documents')
      return 'Private PDF library: reader, semantic search, and AI answers with citations per document.';
    if (path.startsWith('/profile'))
      return 'View learner statistics, questions, answers, and follower connections.';
    return '';
  };

  return (
    <div className={styles.layout}>
      <SidebarWithAddons />
      <div className={styles.layout__content}>
        <NavbarWithAddons
          title={getTitle()}
          subtitle={getSubtitle()}
          user={user}
          onLogout={logout}
        />
        <main className={styles.layout__main}>
          <div className={styles.layout__mainInner}>
            <Outlet />
          </div>
        </main>

        <footer className={styles.layout__footer}>
          <div className={styles['layout__footer-content']}>
            <div className={styles['layout__footer-branding']}>
              <h4 className={styles['layout__footer-title']}>Evangadi Forum</h4>
              <p className={styles['layout__footer-tagline']}>
                A practice space for technical Q&A, peer feedback, and
                AI-assisted search, built for Evangadi learners and mentors.
              </p>
              <p className={styles['layout__footer-copyright']}>
                © 2026 Evangadi Forum. For educational use.
              </p>
            </div>
            <nav className={styles['layout__footer-nav']}>
              <a href='#' className={styles['layout__footer-link']}>
                About
              </a>
              <a href='#' className={styles['layout__footer-link']}>
                Privacy
              </a>
              <a href='#' className={styles['layout__footer-link']}>
                Terms
              </a>
              <a href='#' className={styles['layout__footer-link']}>
                Contact
              </a>
            </nav>
          </div>
        </footer>
      </div>

      {/* Global AI Support Bot */}
      <SupportBot />
    </div>
  );
}
