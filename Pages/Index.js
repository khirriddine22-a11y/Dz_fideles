import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [merchant, setMerchant] = useState(null);
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadMerchant() {
      const { data } = await supabase
        .from('merchants')
        .select('*')
        .limit(1)
        .single();
      if (data) setMerchant(data);
    }
    loadMerchant();
  }, []);

  async function handleLookup(e) {
    e.preventDefault();
    setMessage('');
    if (!phone.trim() || !merchant) return;

    let { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('merchant_id', merchant.id)
      .eq('phone', phone.trim())
      .single();

    if (!existing) {
      const { data: created, error } = await supabase
        .from('customers')
        .insert([{ merchant_id: merchant.id, phone: phone.trim(), points: 1 }])
        .select()
        .single();
      if (error) {
        setMessage('حدث خطأ أثناء تسجيل الزبون.');
        return;
      }
      existing = created;
      setMessage('تم إنشاء بطاقة ولاء جديدة ومنحك 1 نقطة ترحيبية!');
    }

    setCustomer(existing);
  }

  return (
    <div dir="rtl" style={{ maxWidth: 460, margin: '30px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h2>بطاقة الولاء الرقمية</h2>
      <p>التاجر: <strong>{merchant ? merchant.name : 'جاري التحميل...'}</strong></p>

      <form onSubmit={handleLookup} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="tel"
          placeholder="رقم الهاتف (مثال: 0550123456)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ flex: 1, padding: 10, fontSize: 16 }}
        />
        <button type="submit" style={{ padding: '10px 16px', fontSize: 16, cursor: 'pointer' }}>
          دخول
        </button>
      </form>

      {message && <p style={{ color: 'green' }}>{message}</p>}

      {customer && (
        <div style={{ border: '1px solid #ccc', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <h3>رقم الزبون: {customer.phone}</h3>
          <p style={{ fontSize: 22 }}>النقاط الحالية: <strong>{customer.points}</strong></p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <QRCodeCanvas value={JSON.stringify({ id: customer.id, phone: customer.phone })} size={180} />
          </div>
        </div>
      )}
    </div>
  );
    }
