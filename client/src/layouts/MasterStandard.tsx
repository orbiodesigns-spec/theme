import React from 'react';
import { ThemeConfig } from '../lib/types';
import styles from './MasterStandard.module.css';

interface Props {
  theme: ThemeConfig;
}

const MasterStandard: React.FC<Props> = ({ theme }) => {
  const blueGradient = {
    background: `linear-gradient(180deg, ${theme.bluePrimary} 0%, ${theme.blueSecondary} 100%)`,
  };
  const purpleGradient = {
    background: `linear-gradient(180deg, ${theme.purplePrimary} 0%, ${theme.purpleSecondary} 100%)`,
  };

  const blueGradientHorizontal = {
    background: `linear-gradient(90deg, ${theme.bluePrimary} 0%, ${theme.blueSecondary} 100%)`,
  };
  const purpleGradientHorizontal = {
    background: `linear-gradient(90deg, ${theme.purplePrimary} 0%, ${theme.purpleSecondary} 100%)`,
  };

  return (
    <div className={styles.container}>
      {/* Animation Styles are now in the CSS Module */}

      {/* --- BACKGROUND / BASE --- */}
      <div
        className={styles.scoreSidebar}
        style={{ background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)' }}
      >
        <div className={styles.scoreTextContainer}>
          {'SCORE'.split('').map((char, i) => (
            <span key={i} className={styles.scoreChar}>{char}</span>
          ))}
        </div>
      </div>

      {/* --- TOP HEADER SECTION --- */}
      <div className={styles.headerLeft}>
        <div
          className={styles.headerInnerLeft}
          style={blueGradient}
        >
          <div className={styles.shineContainer}>
            <div
              className={`${styles.shineBar} ${styles.animateShine}`}
              style={{
                background: `linear-gradient(90deg, transparent, ${theme.shineColor}, transparent)`,
                transform: 'skewX(-20deg)'
              }}
            />
          </div>
          <div className={styles.glassPanelLeft}></div>
        </div>
      </div>

      <div className={styles.headerRight}>
        <div
          className={styles.headerInnerRight}
          style={purpleGradient}
        >
          <div className={styles.shineContainer}>
            <div
              className={`${styles.shineBar} ${styles.animateShine}`}
              style={{
                background: `linear-gradient(90deg, transparent, ${theme.shineColor}, transparent)`,
                transform: 'skewX(-20deg)',
                animationDelay: '2s'
              }}
            />
          </div>
          <div className={styles.glassPanelRight}></div>
        </div>
      </div>

      {/* --- CIRCLES --- */}
      <div className={`${styles.circleContainer} ${styles.circleLeft}`}>
        <div className={styles.circleBorder} style={{ borderColor: theme.ringColor, boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}></div>
        <div className={styles.circleInner}>
        </div>
        <svg className={`${styles.ringSvg} ${styles.animateRing}`} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke={theme.ringColor} strokeWidth="2" strokeDasharray="20 10" strokeOpacity="0.8" />
        </svg>
      </div>

      <div className={`${styles.circleContainer} ${styles.circleRight}`}>
        <div className={styles.circleBorder} style={{ borderColor: theme.ringColor, boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}></div>
        <div className={styles.circleInner}>
        </div>
        <svg className={`${styles.ringSvg} ${styles.animateRing}`} viewBox="0 0 100 100" style={{ animationDirection: 'reverse' }}>
          <circle cx="50" cy="50" r="46" fill="none" stroke={theme.ringColor} strokeWidth="2" strokeDasharray="20 10" strokeOpacity="0.8" />
        </svg>
      </div>
      {/* --- MIDDLE A STRIP DECORATION --- */}
      <div className={styles.middleStripTop}>
        <div className={styles.stripSegment} style={{ flex: 1, ...blueGradientHorizontal }}></div>
        <div className={styles.stripSegment} style={{ flex: 1, marginLeft: '4px', ...purpleGradientHorizontal }}></div>
      </div>

      {/* --- MIDDLE B STRIP DECORATION --- */}
      {/* --- MIDDLE B STRIP DECORATION --- */}
      <div className={styles.middleStrip}>
        <div className={styles.stripSegment} style={{ width: '300px', background: `linear-gradient(90deg, ${theme.midStrip1Start} 0%, ${theme.midStrip1End} 100%)` }}></div>
        <div className={styles.stripSegment} style={{ width: '300px', marginLeft: '4px', background: `linear-gradient(90deg, ${theme.midStrip2Start} 0%, ${theme.midStrip2End} 100%)` }}></div>
        <div className={styles.stripSpacer} style={{ background: `linear-gradient(90deg, ${theme.midStrip3Start} 0%, ${theme.midStrip3End} 100%)`, borderTop: '2px solid rgba(255,255,255,0.1)' }}></div>
        <div className={styles.stripSegment} style={{ flex: 1, marginLeft: '4px', background: `linear-gradient(90deg, ${theme.midStrip4Start} 0%, ${theme.midStrip4End} 100%)` }}></div>
      </div>

      {/* --- MAIN GREEN SCREEN AREA --- */}
      <div className={styles.chromaArea}>
        {theme.chromaKeyImage ? (
          <img src={theme.chromaKeyImage} alt="Preview Background" className={styles.chromaImage} />
        ) : (
          <div className={styles.chromaPlaceholder}>
            Chroma Key
          </div>
        )}
      </div>

      {/* --- LOWER THIRDS --- */}
      <div className={styles.lowerThirdsContainer}>
        {/* Batsman 1 */}
        <div className={styles.lowerThirdGroup}>
          <div className={styles.lowerThirdLabel}>
            <span className={styles.lowerThirdLabelText}>BATSMAN</span>
          </div>
          <div className={styles.lowerThirdBox}>
            <div className={styles.lowerThirdContent} style={blueGradient}>
              <div className={styles.lowerThirdOverlay}></div>
              <div className={styles.shineContainer}>
                <div className={`${styles.shineBar} ${styles.animateShine}`} style={{ background: `linear-gradient(90deg, transparent, ${theme.boxSweepColor}, transparent)`, transform: 'skewX(-20deg)', animationDelay: '0.2s' }} />
              </div>
            </div>
            <div className={styles.lowerThirdFooter}></div>
          </div>
        </div>

        {/* Batsman 2 */}
        <div className={styles.lowerThirdGroup}>
          <div className={styles.lowerThirdLabel}>
            <span className={styles.lowerThirdLabelText}>BATSMAN</span>
          </div>
          <div className={styles.lowerThirdBox}>
            <div className={styles.lowerThirdContent} style={blueGradient}>
              <div className={styles.lowerThirdOverlay}></div>
              <div className={styles.shineContainer}>
                <div className={`${styles.shineBar} ${styles.animateShine}`} style={{ background: `linear-gradient(90deg, transparent, ${theme.boxSweepColor}, transparent)`, transform: 'skewX(-20deg)', animationDelay: '0.4s' }} />
              </div>
            </div>
            <div className={styles.lowerThirdFooter}>
            </div>
          </div>
        </div>

        {/* Bowler */}
        <div className={styles.lowerThirdGroup}>
          <div className={styles.lowerThirdLabel}>
            <span className={styles.lowerThirdLabelText}>BOWLER</span>
          </div>
          <div className={styles.lowerThirdBox}>
            <div className={styles.lowerThirdContent} style={purpleGradient}>
              <div className={styles.lowerThirdOverlay}></div>
              <div className={styles.shineContainer}>
                <div className={`${styles.shineBar} ${styles.animateShine}`} style={{ background: `linear-gradient(90deg, transparent, ${theme.boxSweepColor}, transparent)`, transform: 'skewX(-20deg)', animationDelay: '0.6s' }} />
              </div>
            </div>
            <div className={styles.lowerThirdFooter}>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.bottomBarGradient}></div>
        <div className={styles.bottomBarBlue}></div>
      </div>
      <div className={styles.bottomDivider}></div>
    </div>
  );
};

export default MasterStandard;
