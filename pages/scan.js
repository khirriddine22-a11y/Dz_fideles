import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabase';

export default function ScanPage() {
  const [status, setStatus] = useState('وجّه الكاميرا نحو رمز QR الخاص بالزبون');
  const [lastCustomer, setLastCustomer] = useState(null);
  const scannerRef = useRef(null);

  async function addPoint(customerId) {
    const { data: current, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (fetchError || !current) {
      setStatus('لم يتم العثور على بطاقة الزبون.');
      return;
    }

    const nextPoints = (current.points || 0) + 1;

    const { data: updated, error: updateError } = await supabase
      .from('customers')
      .update({ points: nextPoints })
      .eq('id', customerId)
      .select()
      .single();

    if (updateError) {
      setStatus('حدث خطأ أثناء إضافة النقطة.');
      return;
    }

    setLastCustomer(updated);
   setStatus(Point added! Total: ${updated.points}); 
  }

egg  useEffect(() => {
    if (scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 220, height: 220 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          const parsed = JSON.parse(decodedText);
          if (parsed && parsed.id) {
            await addPoint(parsed.id);
          } else {
            setStatus('رمز QR غير صالح لبطاقة الولاء.');
          }
        } catch {
          setStatus('تعذّر قراءة بيانات رمز QR.');
        }
      },
      () => {}
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div dir="rtl" style={{ maxWidth: 460, margin: '30px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h2>واجهة التاجر — مسح رمز QR</h2>
      <p>{status}</p>

      <div id="qr-reader" style={{ width: '100%', marginTop: 16 }} />

      {lastCustomer && (
        <div style={{ marginTop: 20, padding: 16, border: '1px solid #ccc', borderRadius: 10 }}>
          <p><strong>رقم الزبون:</strong> {lastCustomer.phone}</p>
          <p><strong>النقاط الجديدة:</strong> {lastCustomer.points}</p>
        </div>
      )}
    </div>
  );
  }
