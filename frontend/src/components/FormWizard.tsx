'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SECTIONS, type FieldDef, type FormData } from '@/lib/form-schema';
import { validateSection, sectionStatus, completionPct } from '@/lib/validation';
import { useFormStore } from '@/stores/formStore';
import { FormField } from './FormField';

function fieldVisible(field: FieldDef, data: FormData): boolean {
  if (!field.conditionalOn) return true;
  const cur = data[field.conditionalOn.key];
  return Array.isArray(cur) ? cur.includes(field.conditionalOn.value) : cur === field.conditionalOn.value;
}

export function FormWizard() {
  const router = useRouter();
  const {
    data, currentSection, consent, saving, draftId,
    setField, toggleArray, setSection, setConsent, saveDraft, submit,
  } = useFormStore();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval>>();

  // Auto-save every 2 min (PRD §6.3)
  useEffect(() => {
    autoSaveRef.current = setInterval(() => { saveDraft().catch(() => {}); }, 120_000);
    return () => clearInterval(autoSaveRef.current);
  }, [saveDraft]);

  const section = SECTIONS.find((s) => s.id === currentSection)!;

  const goNext = () => {
    const e = validateSection(currentSection, data);
    setErrors(e);
    if (Object.keys(e).length > 0) { setToast('Please complete the required fields.'); return; }
    setErrors({});
    if (currentSection < 11) setSection(currentSection + 1);
  };
  const goPrev = () => { setErrors({}); if (currentSection > 1) setSection(currentSection - 1); };

  const handleSave = async () => {
    try { await saveDraft(); flash('Draft saved.'); }
    catch { flash('Could not save draft.'); }
  };

  const handleSubmit = async () => {
    if (!consent || !data.signature) { setToast('Consent and signature are required.'); return; }
    setSubmitting(true);
    try {
      const ref = await submit();
      router.push(`/submission-success?ref=${encodeURIComponent(ref)}`);
    } catch { setToast('Submission failed. Please try again.'); setSubmitting(false); }
  };

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const pct = completionPct(data);
  const allComplete = SECTIONS.slice(0, 10).every((s) => sectionStatus(s.id, data) === 'completed');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'start' }}>
      {/* Step sidebar */}
      <div className="card" style={{ padding: 16, position: 'sticky', top: 28 }}>
        <div style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 4 }}>Completion</div>
        <div style={{ height: 6, background: '#1f1f1f', borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#00bcd4', transition: 'width 0.3s' }} />
        </div>
        {SECTIONS.map((s) => {
          const st = sectionStatus(s.id, data);
          const active = s.id === currentSection;
          const dot = st === 'completed' ? '#00bcd4' : st === 'in-progress' ? '#eab308' : '#3a3a3a';
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', marginBottom: 2,
                background: active ? 'rgba(0,188,212,0.1)' : 'transparent', color: active ? '#00bcd4' : '#cfcfcf', fontSize: 13 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: dot, flexShrink: 0 }} />
              <span style={{ fontWeight: active ? 600 : 400 }}>{s.id}. {s.name}</span>
            </button>
          );
        })}
      </div>

      {/* Section content */}
      <div className="card fade-up" key={currentSection} style={{ padding: 28 }}>
        <div style={{ fontSize: 12, color: '#00bcd4', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
          Step {currentSection} of 11
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 24px' }}>{section.name}</h2>

        {currentSection === 6 ? (
          <MedicationsTable data={data} setField={setField} />
        ) : currentSection === 10 ? (
          <GeneVariantsTable data={data} setField={setField} />
        ) : currentSection === 11 ? (
          <PreviewDeclaration data={data} consent={consent} setConsent={setConsent}
            errors={errors} setField={setField} onJump={setSection} />
        ) : null}

        {/* Regular field grid */}
        {currentSection !== 10 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginTop: currentSection === 6 || currentSection === 11 ? 24 : 0 }}>
            {section.fields.filter((f) => fieldVisible(f, data)).map((f) => (
              <FormField key={f.key} field={f} value={data[f.key]} error={errors[f.key]}
                onChange={(v) => setField(f.key, v)} onToggle={(v) => toggleArray(f.key, v)} />
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 20, borderTop: '1px solid #1f1f1f', flexWrap: 'wrap', gap: 12 }}>
          <button className="btn btn-ghost" onClick={goPrev} disabled={currentSection === 1}>← Previous</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
            {currentSection < 11 ? (
              <button className="btn btn-primary" onClick={goNext}>Next Step →</button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!consent || !data.signature || !allComplete || submitting}>
                {submitting ? 'Submitting…' : 'Submit Form'}
              </button>
            )}
          </div>
        </div>
        {currentSection === 11 && !allComplete && (
          <div style={{ fontSize: 12, color: '#eab308', marginTop: 12 }}>
            Some earlier sections are incomplete. Complete all sections to enable submission.
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#121212', border: '1px solid #00bcd4', color: '#fff', padding: '12px 18px', borderRadius: 6, fontSize: 14, zIndex: 50 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Section 6: repeatable medications table ──
function MedicationsTable({ data, setField }: { data: FormData; setField: (k: string, v: any) => void }) {
  const rows = data.medications || [];
  const update = (i: number, key: string, val: string) => {
    const next = rows.map((r: any, idx: number) => (idx === i ? { ...r, [key]: val } : r));
    setField('medications', next);
  };
  const addRow = () => setField('medications', [...rows, { drugName: '', dose: '', frequency: '', indication: '' }]);
  const removeRow = (i: number) => setField('medications', rows.filter((_: any, idx: number) => idx !== i));

  return (
    <div>
      <div className="lbl">Current Medications</div>
      {rows.map((r: any, i: number) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <input className="inp" placeholder="Drug Name" value={r.drugName} onChange={(e) => update(i, 'drugName', e.target.value)} />
          <input className="inp" placeholder="Dose" value={r.dose} onChange={(e) => update(i, 'dose', e.target.value)} />
          <input className="inp" placeholder="Frequency" value={r.frequency} onChange={(e) => update(i, 'frequency', e.target.value)} />
          <input className="inp" placeholder="Indication" value={r.indication} onChange={(e) => update(i, 'indication', e.target.value)} />
          <button className="btn btn-ghost" style={{ padding: '8px 12px' }} onClick={() => removeRow(i)} disabled={rows.length === 1}>✕</button>
        </div>
      ))}
      <button className="btn btn-ghost" style={{ fontSize: 13, marginTop: 4 }} onClick={addRow}>+ Add Medication</button>
    </div>
  );
}

// ── Section 10: editable gene variants table ──
function GeneVariantsTable({ data, setField }: { data: FormData; setField: (k: string, v: any) => void }) {
  const rows = data.geneVariants || [];
  const update = (i: number, key: string, val: string) => {
    setField('geneVariants', rows.map((r: any, idx: number) => (idx === i ? { ...r, [key]: val } : r)));
  };
  return (
    <div>
      <p style={{ fontSize: 13, color: '#8a8a8a', marginBottom: 16 }}>
        Record genotyping results if available, or leave blank for inference by the reporting team.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 8, fontSize: 11, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 8, borderBottom: '1px solid #1f1f1f' }}>
        <div>Gene / Variant</div><div>Genotype</div><div>Method</div><div>Notes</div>
      </div>
      {rows.map((r: any, i: number) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #141414' }}>
          <div style={{ fontSize: 13 }}>{r.gene}</div>
          <input className="inp" placeholder="AA / GG" value={r.genotype} onChange={(e) => update(i, 'genotype', e.target.value)} />
          <input className="inp" placeholder="PCR" value={r.method} onChange={(e) => update(i, 'method', e.target.value)} />
          <input className="inp" placeholder="Optional" value={r.notes} onChange={(e) => update(i, 'notes', e.target.value)} />
        </div>
      ))}
    </div>
  );
}

// ── Section 11: preview + declaration ──
function PreviewDeclaration({ data, consent, setConsent, errors, setField, onJump }:
  { data: FormData; consent: boolean; setConsent: (v: boolean) => void; errors: Record<string, string>; setField: (k: string, v: any) => void; onJump: (n: number) => void }) {
  return (
    <div>
      {/* Read-only summary of all sections */}
      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        {SECTIONS.slice(0, 10).map((s) => (
          <div key={s.id} className="card" style={{ padding: 16, background: '#0a0a0a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 14 }}>{s.id}. {s.name}</strong>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => onJump(s.id)}>Edit</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 13 }}>
              {s.id === 6 ? (
                <div style={{ color: '#cfcfcf' }}>{(data.medications || []).filter((m: any) => m.drugName).map((m: any) => m.drugName).join(', ') || '—'}</div>
              ) : s.id === 10 ? (
                <div style={{ color: '#cfcfcf' }}>{(data.geneVariants || []).filter((g: any) => g.genotype).length} variants recorded</div>
              ) : s.fields.map((f) => {
                const v = data[f.key];
                if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return null;
                return (
                  <div key={f.key}>
                    <span style={{ color: '#8a8a8a' }}>{f.label}: </span>
                    <span>{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Consent (PRD §6.4) */}
      <div className="card" style={{ padding: 20, background: '#0a0a0a' }}>
        <p style={{ fontSize: 13, color: '#cfcfcf', lineHeight: 1.7, marginBottom: 16 }}>
          I confirm the information provided is accurate and complete to the best of my knowledge. I consent to the
          collection and analysis of clinical, biochemical, and genetic data for the purpose of generating a personalised
          semaglutide response assessment. This report supports the treating physician&apos;s clinical decision-making and does
          not constitute a prescription or replace specialist medical advice.
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ accentColor: '#00bcd4', width: 18, height: 18 }} />
          I agree to the consent declaration <span className="req">*</span>
        </label>
      </div>
    </div>
  );
}
