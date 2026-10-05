import styles from './BreakingNewsBanner.module.css';

const headline = 'Antonio Brown Bombs Hospital in Mike Tomlin’s Minecraft City';

export default function BreakingNewsBanner(){
  return (
    <div aria-label="Breaking news" className={styles.banner}>
      <div className={styles.inner}>
        <span className={styles.label}>Breaking News</span>
        <a className={styles.viewport} aria-label={headline} href="https://x.com/ab84/status/2105831116464886238" target="_blank" rel="noopener noreferrer">
          <span className={styles.track} aria-hidden="true">
            {[0, 1].map(copy => <span className={styles.item} key={copy}>{headline}<span className={styles.update}> · Global Update · </span></span>)}
          </span>
        </a>
      </div>
    </div>
  );
}
