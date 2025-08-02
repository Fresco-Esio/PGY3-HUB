// Timeline Hover Cards - Patient and clinician content cards that appear on hover
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Stethoscope, 
  Edit3, 
  Calendar,
  Clock,
  FileText
} from 'lucide-react';

// Card animation variants
const cardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 10
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 400,
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 5,
    transition: {
      duration: 0.2
    }
  }
};

// Patient Narrative Card
export const PatientCard = ({ 
  entry, 
  position, 
  isVisible, 
  onEdit,
  isLoading = false 
}) => {
  const [content, setContent] = useState(null);

  // Load content only when visible (hover-only loading)
  useEffect(() => {
    if (isVisible && !content && !isLoading) {
      // Simulate content loading - in real app, this would be an API call
      const timer = setTimeout(() => {
        setContent({
          narrative: entry?.patient_narrative || 'No patient narrative recorded yet.',
          symptoms: entry?.symptoms || ['Fatigue', 'Headache'],
          vitals: entry?.vitals || { bp: '120/80', hr: '72', temp: '98.6°F' }
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, content, isLoading, entry]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute z-50 bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-600 shadow-2xl p-4 min-w-[280px] max-w-[320px]"
        style={{
          left: position.x,
          top: position.y,
          transform: `translate(${position.side === 'left' ? '-100%' : '0'}, -50%)`
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-600/20 rounded-lg">
              <User size={14} className="text-green-400" />
            </div>
            <h4 className="text-sm font-semibold text-white">Patient Narrative</h4>
          </div>
          <button
            onClick={() => onEdit && onEdit(entry.id, 'patient')}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
            title="Edit patient narrative"
          >
            <Edit3 size={12} />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-xs text-slate-400 mt-2">Loading...</p>
          </div>
        ) : content ? (
          <div className="space-y-3">
            {/* Narrative */}
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Narrative:</p>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                {content.narrative}
              </p>
            </div>

            {/* Symptoms */}
            {content.symptoms?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-300 mb-1">Symptoms:</p>
                <div className="flex flex-wrap gap-1">
                  {content.symptoms.slice(0, 3).map((symptom, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-red-600/20 text-red-300 rounded-full text-xs"
                    >
                      {symptom}
                    </span>
                  ))}
                  {content.symptoms.length > 3 && (
                    <span className="px-2 py-1 bg-slate-600 text-slate-300 rounded-full text-xs">
                      +{content.symptoms.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Vitals */}
            {content.vitals && (
              <div>
                <p className="text-xs font-medium text-slate-300 mb-1">Vitals:</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-slate-400">BP</p>
                    <p className="text-white font-medium">{content.vitals.bp}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400">HR</p>
                    <p className="text-white font-medium">{content.vitals.hr}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400">Temp</p>
                    <p className="text-white font-medium">{content.vitals.temp}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Timestamp */}
        {entry?.timestamp && (
          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-slate-700">
            <Clock size={10} className="text-slate-500" />
            <span className="text-xs text-slate-500">
              {new Date(entry.timestamp).toLocaleString()}
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Clinical Notes Card
export const ClinicianCard = ({ 
  entry, 
  position, 
  isVisible, 
  onEdit,
  isLoading = false 
}) => {
  const [content, setContent] = useState(null);

  // Load content only when visible (hover-only loading)
  useEffect(() => {
    if (isVisible && !content && !isLoading) {
      const timer = setTimeout(() => {
        setContent({
          notes: entry?.clinical_notes || 'No clinical notes recorded yet.',
          assessment: entry?.assessment || 'Pending assessment',
          plan: entry?.treatment_plan || 'Treatment plan to be determined'
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, content, isLoading, entry]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute z-50 bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-600 shadow-2xl p-4 min-w-[280px] max-w-[320px]"
        style={{
          left: position.x,
          top: position.y,
          transform: `translate(${position.side === 'right' ? '0' : '-100%'}, -50%)`
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600/20 rounded-lg">
              <Stethoscope size={14} className="text-blue-400" />
            </div>
            <h4 className="text-sm font-semibold text-white">Clinical Notes</h4>
          </div>
          <button
            onClick={() => onEdit && onEdit(entry.id, 'clinical')}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
            title="Edit clinical notes"
          >
            <Edit3 size={12} />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-xs text-slate-400 mt-2">Loading...</p>
          </div>
        ) : content ? (
          <div className="space-y-3">
            {/* Clinical Notes */}
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Notes:</p>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                {content.notes}
              </p>
            </div>

            {/* Assessment */}
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Assessment:</p>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {content.assessment}
              </p>
            </div>

            {/* Plan */}
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Plan:</p>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {content.plan}
              </p>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700">
          <div className="flex items-center gap-1">
            <FileText size={10} className="text-slate-500" />
            <span className="text-xs text-slate-500">Clinical Record</span>
          </div>
          {entry?.updated_at && (
            <span className="text-xs text-slate-500">
              Updated {new Date(entry.updated_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default { PatientCard, ClinicianCard };