'use client';
import { type FieldDef } from '@/lib/form-schema';

interface Props {
  field: FieldDef;
  value: any;
  error?: string;
  onChange: (value: any) => void;
  onToggle: (value: string) => void;
}

export function FormField({ field, value, error, onChange, onToggle }: Props) {
  const id = `f-${field.key}`;

  const labelEl = (
    <label className="lbl" htmlFor={id}>
      {field.label}
      {field.required && <span className="req">*</span>}
      {field.unit && <span style={{ color: '#555', marginLeft: 6, textTransform: 'none' }}>({field.unit})</span>}
    </label>
  );

  // Checkbox group
  if (field.type === 'checkbox-group') {
    const arr: string[] = Array.isArray(value) ? value : [];
    return (
      <div style={{ gridColumn: '1 / -1' }}>
        {labelEl}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 4 }}>
          {field.options!.map((opt) => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={arr.includes(opt)}
                onChange={() => onToggle(opt)}
                style={{ accentColor: '#00bcd4', width: 15, height: 15 }}
              />
              {opt}
            </label>
          ))}
        </div>
        {error && <div className="errtext">{error}</div>}
      </div>
    );
  }

  // Radio group
  if (field.type === 'radio') {
    return (
      <div>
        {labelEl}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginTop: 4 }}>
          {field.options!.map((opt) => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="radio"
                name={id}
                checked={value === opt}
                onChange={() => onChange(opt)}
                style={{ accentColor: '#00bcd4', width: 15, height: 15 }}
              />
              {opt}
            </label>
          ))}
        </div>
        {error && <div className="errtext">{error}</div>}
      </div>
    );
  }

  // Select
  if (field.type === 'select') {
    return (
      <div>
        {labelEl}
        <select id={id} className={`inp ${error ? 'err' : ''}`} value={value || ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Select —</option>
          {field.options!.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        {error && <div className="errtext">{error}</div>}
      </div>
    );
  }

  // Textarea
  if (field.type === 'textarea') {
    return (
      <div style={{ gridColumn: '1 / -1' }}>
        {labelEl}
        <textarea id={id} className={`inp ${error ? 'err' : ''}`} rows={3} value={value || ''}
          placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} style={{ resize: 'vertical' }} />
        {error && <div className="errtext">{error}</div>}
      </div>
    );
  }

  // Default: text/number/date/etc
  const inputType =
    field.type === 'datetime' ? 'datetime-local' :
    field.type === 'tel' ? 'tel' :
    field.type === 'email' ? 'email' :
    field.type;

  return (
    <div>
      {labelEl}
      <input
        id={id}
        type={inputType}
        className={`inp ${error ? 'err' : ''}`}
        value={value ?? ''}
        placeholder={field.placeholder}
        readOnly={field.key === 'bmi' || field.key === 'age'}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <div className="errtext">{error}</div>}
    </div>
  );
}
