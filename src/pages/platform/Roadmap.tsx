import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import {
  ROADMAP_FEATURES,
  STATUS_CONFIG,
  CATEGORY_LABELS,
  type FeatureStatus,
  type FeatureVoteSummary,
} from '../../components/roadmap/roadmapData';
import styles from './Roadmap.module.scss';

const Roadmap = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [voteSummaries, setVoteSummaries] = useState<Map<string, FeatureVoteSummary>>(new Map());
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [showAuthBanner, setShowAuthBanner] = useState(false);

  // Check auth and fetch votes on mount
  useEffect(() => {
    const init = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      await fetchVotes(currentSession);
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchVotes = async (currentSession: Session | null) => {
    const { data: allVotes } = await supabase
      .from('feature_votes')
      .select('feature_id, user_id');

    const summaryMap = new Map<string, FeatureVoteSummary>();
    for (const feature of ROADMAP_FEATURES) {
      const featureVotes = allVotes?.filter((v) => v.feature_id === feature.id) || [];
      summaryMap.set(feature.id, {
        featureId: feature.id,
        voteCount: featureVotes.length,
        userHasVoted: currentSession
          ? featureVotes.some((v) => v.user_id === currentSession.user.id)
          : false,
      });
    }
    setVoteSummaries(summaryMap);
  };

  const handleVote = useCallback(
    async (featureId: string) => {
      if (!session) {
        setShowAuthBanner(true);
        return;
      }

      const current = voteSummaries.get(featureId);
      if (!current || votingId) return;

      const isToggleOff = current.userHasVoted;
      setVotingId(featureId);

      // Optimistic update
      setVoteSummaries((prev) => {
        const next = new Map(prev);
        next.set(featureId, {
          featureId,
          voteCount: current.voteCount + (isToggleOff ? -1 : 1),
          userHasVoted: !isToggleOff,
        });
        return next;
      });

      try {
        if (isToggleOff) {
          await supabase
            .from('feature_votes')
            .delete()
            .eq('user_id', session.user.id)
            .eq('feature_id', featureId);
        } else {
          await supabase
            .from('feature_votes')
            .insert({ user_id: session.user.id, feature_id: featureId });
        }
      } catch {
        // Revert on failure
        setVoteSummaries((prev) => {
          const next = new Map(prev);
          next.set(featureId, current);
          return next;
        });
      } finally {
        setVotingId(null);
      }
    },
    [session, voteSummaries, votingId],
  );

  // Group features by status, sorted by vote count within each group
  const statusGroups = useMemo(() => {
    return Object.entries(STATUS_CONFIG)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([status, config]) => ({
        status: status as FeatureStatus,
        ...config,
        features: ROADMAP_FEATURES
          .filter((f) => f.status === status)
          .sort((a, b) => {
            const aVotes = voteSummaries.get(a.id)?.voteCount ?? 0;
            const bVotes = voteSummaries.get(b.id)?.voteCount ?? 0;
            return bVotes - aVotes;
          }),
      }));
  }, [voteSummaries]);

  if (loading) {
    return (
      <div className={styles.roadmapPage}>
        <div className={styles.loading}>Loading roadmap...</div>
      </div>
    );
  }

  return (
    <div className={styles.roadmapPage}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Roadmap</h1>
        <p className={styles.subtitle}>
          See what we're building next. Vote for the features you want most.
        </p>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {statusGroups.map((group) => (
          <section key={group.status} className={styles.statusSection}>
            <div className={styles.statusHeader}>
              <span
                className={styles.statusDot}
                style={{ background: group.color }}
              />
              <span className={styles.statusLabel}>{group.label}</span>
              <span className={styles.statusCount}>
                {group.features.length}
              </span>
            </div>

            <div className={styles.featuresGrid}>
              {group.features.map((feature) => {
                const summary = voteSummaries.get(feature.id);
                const hasVoted = summary?.userHasVoted ?? false;
                const voteCount = summary?.voteCount ?? 0;
                const isVoting = votingId === feature.id;

                return (
                  <div key={feature.id} className={styles.featureCard}>
                    <div className={styles.featureTop}>
                      <div className={styles.featureInfo}>
                        <h3 className={styles.featureTitle}>{feature.title}</h3>
                        <p className={styles.featureDescription}>
                          {feature.description}
                        </p>
                      </div>
                    </div>

                    <div className={styles.featureFooter}>
                      <span className={styles.categoryBadge}>
                        {CATEGORY_LABELS[feature.category]}
                      </span>

                      <button
                        className={`${styles.voteButton} ${hasVoted ? styles.voteButtonActive : ''} ${isVoting ? styles.voteButtonDisabled : ''}`}
                        onClick={() => handleVote(feature.id)}
                        disabled={isVoting}
                      >
                        <span className={styles.voteIcon}>
                          <svg
                            viewBox="0 0 24 24"
                            fill={hasVoted ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 19V5M5 12l7-7 7 7" />
                          </svg>
                        </span>
                        <span className={styles.voteCount}>{voteCount}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Auth Prompt Banner */}
      <div
        className={`${styles.authBanner} ${showAuthBanner ? styles.authBannerVisible : ''}`}
      >
        <span className={styles.authBannerText}>
          Sign in to vote on features you want to see built.
        </span>
        <div className={styles.authBannerActions}>
          <Link
            to="/login"
            className={`${styles.authBannerLink} ${styles.authBannerSignIn}`}
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className={`${styles.authBannerLink} ${styles.authBannerSignUp}`}
          >
            Create account
          </Link>
        </div>
        <button
          className={styles.authBannerDismiss}
          onClick={() => setShowAuthBanner(false)}
          aria-label="Dismiss"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Roadmap;
