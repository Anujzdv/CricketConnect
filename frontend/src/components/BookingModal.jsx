import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Trophy, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function BookingModal({ ground, slot, onClose, onBookingSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookingState, setBookingState] = useState('idle'); // 'idle' | 'loading' | 'conflict' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const handleConfirmReservation = async () => {
    setBookingState('loading');
    setErrorMessage('');

    try {
      const payload = {
        slot_id: slot.id,
        amount_paid: slot.price
      };

      const res = await apiClient.post('/booking/reserve', payload);

      if (res.data.success) {
        setConfirmedBooking(res.data.data.bookings[0]);
        setBookingState('success');
        if (onBookingSuccess) onBookingSuccess(slot.id);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // High-concurrency conflict: another user booked the slot first
        setBookingState('conflict');
        setErrorMessage(
          err.response?.data?.error?.message ||
          'This slot was just booked by another captain milliseconds before your request. Please select an alternate slot.'
        );
      } else {
        setBookingState('error');
        setErrorMessage(err.response?.data?.error?.message || err.message || 'Booking failed');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content according to booking state */}
        {bookingState === 'success' ? (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white font-heading">Booking Confirmed!</h3>
              <p className="text-sm text-slate-300 mt-1">
                Your reservation at <span className="text-emerald-400 font-semibold">{ground.name}</span> is locked.
              </p>
            </div>

            {/* Booking Details Pill */}
            <div className="p-4 rounded-2xl bg-surface-850/80 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Booking Reference:</span>
                <span className="font-mono text-emerald-300 font-bold">#{confirmedBooking?.id || 'CC-9021'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Slot:</span>
                <span className="text-slate-200">{slot.slot_date} ({slot.start_time} - {slot.end_time})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid (Recorded):</span>
                <span className="text-slate-200 font-semibold">₹{slot.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Booked By:</span>
                <span className="text-slate-200">{user?.name || 'Captain'}</span>
              </div>
            </div>

            {/* Next Steps Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  navigate('/matches', { state: { createMatchWithBooking: confirmedBooking } });
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-surface-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
              >
                <Trophy className="w-4 h-4" />
                <span>Create Match For This Slot</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  navigate('/my-bookings');
                }}
                className="py-3 px-4 rounded-xl bg-surface-850 hover:bg-surface-800 border border-slate-700 text-slate-200 font-semibold text-xs transition-all"
              >
                <span>View My Bookings</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Guaranteed Instant Reservation</span>
              </div>
              <h3 className="text-2xl font-bold text-white font-heading">Confirm Reservation</h3>
              <p className="text-xs text-slate-400 mt-1">
                Venue: <span className="text-slate-200 font-medium">{ground.name}, {ground.city}</span>
              </p>
            </div>

            {/* Slot Details Card */}
            <div className="p-4 rounded-2xl bg-surface-850 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Date
                </span>
                <span className="font-semibold text-slate-200">{slot.slot_date}</span>
              </div>

              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Time Slot
                </span>
                <span className="font-semibold text-slate-200">{slot.start_time} - {slot.end_time}</span>
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-slate-300 font-medium">Total Booking Amount:</span>
                <span className="text-xl font-bold text-emerald-400 font-heading">₹{slot.price}</span>
              </div>
            </div>

            {/* Conflict State (409 Error) */}
            {bookingState === 'conflict' && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 animate-shake">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-200">Slot Just Reserved</p>
                  <p className="leading-relaxed">Another captain just booked this slot moments ago. Please choose another available time slot.</p>
                </div>
              </div>
            )}

            {/* General Error State */}
            {bookingState === 'error' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Booking Guarantee Footer Note */}
            <div className="text-[11px] text-slate-400 leading-relaxed bg-surface-900/60 p-3 rounded-xl border border-white/5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant confirmation. Your pitch reservation is held and confirmed directly with the venue management.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={bookingState === 'loading'}
                className="flex-1 py-3 px-4 rounded-xl bg-surface-850 hover:bg-surface-800 border border-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReservation}
                disabled={bookingState === 'loading'}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-surface-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                {bookingState === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Acquiring Row Lock...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Reservation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
