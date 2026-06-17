import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { useMessage } from '../../hooks/useMessage';
import { membershipService, type MembershipDraft } from '../../services/membershipService';
import type { GymMembership } from '../../types/tenant';
import { Button, Card } from '../common';
import styles from './MembershipsPanel.module.scss';

// Stripe's minimum GBP card charge is 30p.
const MIN_DAY_PASS_PENCE = 30;

let draftCounter = 0;
const newDraftId = () => `new:${(draftCounter += 1)}`;

const toDraft = (plan: GymMembership): MembershipDraft => ({
  id: plan.id,
  display_name: plan.display_name,
  description: plan.description ?? '',
  price_pence: plan.price_pence,
  billing_period: plan.billing_period === 'yearly' ? 'yearly' : 'monthly',
  features: plan.features ?? [],
  is_active: plan.is_active,
});

const emptyDraft = (): MembershipDraft => ({
  id: newDraftId(),
  display_name: '',
  description: '',
  price_pence: null,
  billing_period: 'monthly',
  features: [],
  is_active: true,
});

const poundsFromPence = (pence: number | null): string =>
  pence === null || pence === undefined ? '' : (pence / 100).toFixed(2);

const penceFromPounds = (pounds: string): number | null => {
  if (pounds.trim() === '') return null;
  const n = Number(pounds);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
};

const MembershipsPanel: React.FC = () => {
  const { gym, features, refreshTenant } = useTenant();
  const { message, showSuccess, showError } = useMessage();
  const [originals, setOriginals] = useState<GymMembership[]>([]);
  const [drafts, setDrafts] = useState<MembershipDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dayPassInput, setDayPassInput] = useState('');
  const [savingDayPass, setSavingDayPass] = useState(false);

  const load = useCallback(async () => {
    if (!gym) return;
    setIsLoading(true);
    try {
      const plans = await membershipService.listPlans(gym.id);
      setOriginals(plans);
      setDrafts(plans.map(toDraft));
    } catch {
      showError('Could not load your membership plans.');
    } finally {
      setIsLoading(false);
    }
  }, [gym, showError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (gym) setDayPassInput(poundsFromPence(gym.day_pass_price_pence ?? 1000));
  }, [gym]);

  const handleSaveDayPass = async () => {
    if (!gym) return;
    const pence = penceFromPounds(dayPassInput);
    if (pence === null || pence < MIN_DAY_PASS_PENCE) {
      showError('Day-pass price must be at least £0.30, the minimum card charge Stripe allows.');
      return;
    }
    setSavingDayPass(true);
    try {
      const { error } = await supabase.from('gyms').update({ day_pass_price_pence: pence }).eq('id', gym.id);
      if (error) throw error;
      await refreshTenant();
      showSuccess('Day-pass price saved.');
    } catch {
      showError('Could not save the day-pass price. Please try again.');
    } finally {
      setSavingDayPass(false);
    }
  };

  const dayPassDirty = gym ? penceFromPounds(dayPassInput) !== (gym.day_pass_price_pence ?? 1000) : false;
  const paymentsConnected = gym?.stripe_account_status === 'active';
  const isDirty = JSON.stringify(drafts) !== JSON.stringify(originals.map(toDraft));

  const updateDraft = (id: string, patch: Partial<MembershipDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const moveDraft = (index: number, dir: -1 | 1) => {
    setDrafts((prev) => {
      const arr = [...prev];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  const removeDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const addDraft = () => {
    setDrafts((prev) => [...prev, emptyDraft()]);
  };

  const updateFeature = (id: string, index: number, value: string) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, features: d.features.map((f, i) => (i === index ? value : f)) } : d
      )
    );
  };

  const addFeature = (id: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, features: [...d.features, ''] } : d)));
  };

  const removeFeature = (id: string, index: number) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, features: d.features.filter((_, i) => i !== index) } : d))
    );
  };

  const validate = (): string | null => {
    for (const d of drafts) {
      if (!d.display_name.trim()) return 'Every plan needs a name.';
      if (d.is_active && (d.price_pence === null || d.price_pence <= 0)) {
        return `"${d.display_name.trim() || 'Untitled'}" needs a price above £0 to be active.`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!gym) return;
    const error = validate();
    if (error) {
      showError(error);
      return;
    }
    setIsSaving(true);
    try {
      const saved = await membershipService.savePlans(gym.id, drafts, originals);
      setOriginals(saved);
      setDrafts(saved.map(toDraft));
      await refreshTenant();
      showSuccess('Membership plans saved.');
    } catch {
      showError('Could not save your plans. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!gym || isLoading) {
    return (
      <div className={styles.membershipsPanel}>
        <p className={styles.loadingText}>Loading membership plans...</p>
      </div>
    );
  }

  return (
    <div className={styles.membershipsPanel}>
      {message && (
        <div className={`${styles.panelMessage} ${styles[message.type]}`}>{message.text}</div>
      )}

      <div className={styles.panelIntro}>
        <h2 className={styles.panelTitle}>Pricing &amp; Plans</h2>
        <p className={styles.panelSubtitle}>
          Set what you charge across your site: the price of a single day pass, and the recurring
          membership plans members can subscribe to.
        </p>
      </div>

      <Card className={styles.dayPassCard}>
        <div className={styles.dayPassHeader}>
          <div>
            <h3 className={styles.dayPassTitle}>Day pass</h3>
            <p className={styles.dayPassSubtitle}>
              The price for a single class without a membership.
              {!features?.day_passes && ' Day passes are currently turned off in the Features tab.'}
            </p>
          </div>
        </div>
        <div className={styles.dayPassRow}>
          <div className={styles.dayPassField}>
            <label htmlFor="day_pass_price">Price (£)</label>
            <input
              type="number"
              id="day_pass_price"
              min="0.30"
              step="0.01"
              value={dayPassInput}
              onChange={(e) => setDayPassInput(e.target.value)}
              className={styles.planInput}
              placeholder="10.00"
            />
          </div>
          <Button variant="primary" onClick={handleSaveDayPass} disabled={!dayPassDirty || savingDayPass}>
            {savingDayPass ? 'Saving...' : 'Save price'}
          </Button>
        </div>
      </Card>

      <h3 className={styles.sectionHeading}>Membership plans</h3>

      {!paymentsConnected && (
        <div className={styles.connectNotice}>
          <strong>Payments aren't connected yet.</strong> You can set up your plans now, but members
          can only subscribe once you've connected Stripe on the Payments tab.
        </div>
      )}

      {drafts.length === 0 && (
        <Card className={styles.emptyCard}>
          <p>You haven't created any membership plans yet.</p>
          <Button variant="primary" onClick={addDraft}>+ Add your first plan</Button>
        </Card>
      )}

      {drafts.map((draft, index) => (
        <Card key={draft.id} className={`${styles.planCard} ${!draft.is_active ? styles.planArchived : ''}`}>
          <div className={styles.planCardHeader}>
            <span className={styles.planIndex}>Plan {index + 1}</span>
            <div className={styles.planHeaderControls}>
              <label className={styles.activeToggle}>
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => updateDraft(draft.id, { is_active: e.target.checked })}
                />
                <span>{draft.is_active ? 'Active' : 'Hidden'}</span>
              </label>
              <div className={styles.orderControls}>
                <button type="button" className={styles.orderButton} aria-label="Move plan up" disabled={index === 0} onClick={() => moveDraft(index, -1)}>↑</button>
                <button type="button" className={styles.orderButton} aria-label="Move plan down" disabled={index === drafts.length - 1} onClick={() => moveDraft(index, 1)}>↓</button>
                <button type="button" className={styles.orderButton} aria-label="Remove plan" onClick={() => removeDraft(draft.id)}>✕</button>
              </div>
            </div>
          </div>

          <div className={styles.planFormGrid}>
            <div className={styles.planField}>
              <label htmlFor={`name_${draft.id}`}>Plan name</label>
              <input
                type="text"
                id={`name_${draft.id}`}
                value={draft.display_name}
                onChange={(e) => updateDraft(draft.id, { display_name: e.target.value })}
                className={styles.planInput}
                placeholder="e.g. Unlimited"
              />
            </div>

            <div className={styles.planFieldPrice}>
              <label htmlFor={`price_${draft.id}`}>Price (£)</label>
              <input
                type="number"
                id={`price_${draft.id}`}
                min="0"
                step="0.01"
                value={poundsFromPence(draft.price_pence)}
                onChange={(e) => updateDraft(draft.id, { price_pence: penceFromPounds(e.target.value) })}
                className={styles.planInput}
                placeholder="0.00"
              />
            </div>

            <div className={styles.planFieldPeriod}>
              <label htmlFor={`period_${draft.id}`}>Billed</label>
              <select
                id={`period_${draft.id}`}
                value={draft.billing_period}
                onChange={(e) => updateDraft(draft.id, { billing_period: e.target.value as 'monthly' | 'yearly' })}
                className={styles.planSelect}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className={styles.planField}>
            <label htmlFor={`desc_${draft.id}`}>Short description</label>
            <input
              type="text"
              id={`desc_${draft.id}`}
              value={draft.description}
              onChange={(e) => updateDraft(draft.id, { description: e.target.value })}
              className={styles.planInput}
              placeholder="One line about who this plan suits"
            />
          </div>

          <div className={styles.planField}>
            <label>What's included</label>
            <div className={styles.featureList}>
              {draft.features.map((feature, fi) => (
                <div key={fi} className={styles.featureRow}>
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(draft.id, fi, e.target.value)}
                    className={styles.planInput}
                    placeholder="e.g. Unlimited classes"
                  />
                  <button type="button" className={styles.orderButton} aria-label="Remove feature" onClick={() => removeFeature(draft.id, fi)}>✕</button>
                </div>
              ))}
              <Button variant="ghost" size="compact" onClick={() => addFeature(draft.id)}>+ Add feature</Button>
            </div>
          </div>

          {draft.id.startsWith('new:') ? null : (
            <p className={styles.planHint}>
              Changing the price creates a new billing rate for new subscribers. Members already on
              this plan keep their current price until they resubscribe.
            </p>
          )}
        </Card>
      ))}

      {drafts.length > 0 && (
        <div className={styles.panelActions}>
          <Button variant="outline" onClick={addDraft} disabled={isSaving}>+ Add plan</Button>
          <Button variant="primary" onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MembershipsPanel;
