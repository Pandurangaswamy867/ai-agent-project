import { useState } from 'react';
import axios from 'axios';
import config from '../config';  // correct path
import { useToast } from '../context/ToastContext';  // correct path

// TypeScript window extension for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface AddPaymentFormProps {
  mseId: number;
  onSuccess: () => void;
}

export default function AddPaymentForm({ mseId, onSuccess }: AddPaymentFormProps) {
  const { showToast } = useToast();
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [loading, setLoading] = useState(false);

  const startVoiceInput = () => {
    console.log("Voice button clicked");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => console.log("Voice recognition started");

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log("You said:", transcript);

      // Optional: auto-fill input field
      const inputField = document.querySelector<HTMLInputElement>('#voiceInput');
      if (inputField) inputField.value = transcript;

      // Auto-fill form fields
      if (transcript.includes("order")) setOrderId("ORD-1234");
      if (transcript.includes("amount")) setAmount("5000");
      if (transcript.includes("partner")) setPartnerId("1");
    };

    recognition.onerror = (err: any) => console.error("Voice error:", err);

    recognition.start();
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId || !amount || !partnerId) {
      showToast('Please fill all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${config.API_BASE_URL}/transactions/`, {
        mse_id: mseId,
        snp_id: Number(partnerId),
        order_id: orderId,
        amount: Number(amount),
        status: 'pending',
        transaction_date: new Date().toISOString()
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      showToast('Payment added successfully', 'success');
      setOrderId('');
      setAmount('');
      setPartnerId('');
      onSuccess(); // Refresh table
    } catch (error: any) {
      console.log("Payment error:", error.response || error.message);
      showToast('Failed to add payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border border-slate-200 mb-4 flex gap-3 items-end">
      <div>
        <label className="text-xs font-medium text-slate-500">Order ID</label>
        <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)}
          id="voiceInput"  // optional for auto-fill
          className="mt-1 p-2 border rounded w-full text-sm" placeholder="ORD-1234" />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500">Amount</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          className="mt-1 p-2 border rounded w-full text-sm" placeholder="5000" />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500">Partner ID</label>
        <input type="number" value={partnerId} onChange={e => setPartnerId(e.target.value)}
          className="mt-1 p-2 border rounded w-full text-sm" placeholder="1" />
      </div>

      <button type="submit"
        className={`px-4 py-2 bg-[#002147] text-white rounded text-sm font-medium ${loading ? 'opacity-50' : ''}`}
        disabled={loading}>
        {loading ? 'Adding…' : 'Add Payment'}
      </button>

      <button
        type="button"
        onClick={startVoiceInput}
        style={{
          position: 'relative',
          zIndex: 9999,
          cursor: 'pointer',
          padding: '10px 20px',
          backgroundColor: '#22c55e',
          color: 'white',
          borderRadius: '6px',
          fontSize: '14px'
        }}
        className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium cursor-pointer"
      >
        🎤 Voice
      </button>
    </form>
  );
}