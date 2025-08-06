import React, { forwardRef } from 'react';

const TimelineCard = forwardRef(({ 
  type, 
  data, 
  position, 
  nodeId, 
  title, 
  date 
}, ref) => {
  const getCardStyle = (type) => {
    switch (type) {
      case 'patient':
        return {
          bg: 'bg-blue-50 border-blue-200',
          header: 'bg-blue-500 text-white',
          title: 'Patient Information'
        };
      case 'clinical':
        return {
          bg: 'bg-green-50 border-green-200',
          header: 'bg-green-500 text-white',
          title: 'Clinical Assessment'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          header: 'bg-gray-500 text-white',
          title: 'Information'
        };
    }
  };

  const cardStyle = getCardStyle(type);

  const renderPatientContent = (patientData) => (
    <div className="space-y-3">
      {patientData.age && (
        <div>
          <span className="font-medium text-gray-700">Age:</span>
          <span className="ml-2 text-gray-600">{patientData.age} years old</span>
        </div>
      )}
      
      {patientData.chiefComplaint && (
        <div>
          <span className="font-medium text-gray-700">Chief Complaint:</span>
          <p className="mt-1 text-sm text-gray-600">{patientData.chiefComplaint}</p>
        </div>
      )}
      
      {patientData.currentPresentation && (
        <div>
          <span className="font-medium text-gray-700">Presentation:</span>
          <p className="mt-1 text-sm text-gray-600">{patientData.currentPresentation}</p>
        </div>
      )}
      
      {patientData.currentSymptoms && patientData.currentSymptoms.length > 0 && (
        <div>
          <span className="font-medium text-gray-700">Current Symptoms:</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {patientData.currentSymptoms.map((symptom, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
              >
                {symptom}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderClinicalContent = (clinicalData) => (
    <div className="space-y-3">
      {clinicalData.diagnosis && (
        <div>
          <span className="font-medium text-gray-700">Diagnosis:</span>
          <p className="mt-1 text-sm text-gray-600">{clinicalData.diagnosis}</p>
        </div>
      )}
      
      {clinicalData.assessment && (
        <div>
          <span className="font-medium text-gray-700">Assessment:</span>
          <p className="mt-1 text-sm text-gray-600">{clinicalData.assessment}</p>
        </div>
      )}
      
      {clinicalData.plan && (
        <div>
          <span className="font-medium text-gray-700">Plan:</span>
          <p className="mt-1 text-sm text-gray-600">{clinicalData.plan}</p>
        </div>
      )}
      
      {clinicalData.medications && clinicalData.medications.length > 0 && (
        <div>
          <span className="font-medium text-gray-700">Medications:</span>
          <div className="mt-1 space-y-1">
            {clinicalData.medications.map((med, index) => (
              <span 
                key={index}
                className="block px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
              >
                {med}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {clinicalData.progress && (
        <div>
          <span className="font-medium text-gray-700">Progress:</span>
          <span className="ml-2 text-sm text-gray-600">{clinicalData.progress}</span>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={ref}
      className={`absolute w-80 border-2 rounded-lg shadow-lg z-20 transition-all duration-300 ${cardStyle.bg}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxHeight: '300px',
        overflow: 'hidden'
      }}
    >
      {/* Card header */}
      <div className={`px-4 py-2 ${cardStyle.header}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-sm">{cardStyle.title}</h3>
          <span className="text-xs opacity-90">{date}</span>
        </div>
        <div className="text-xs opacity-75 mt-1">{title}</div>
      </div>

      {/* Card content */}
      <div className="p-4 max-h-48 overflow-y-auto">
        {type === 'patient' ? renderPatientContent(data || {}) : renderClinicalContent(data || {})}
      </div>

      {/* Connection line to node - visual indicator */}
      <div className="absolute top-1/2 transform -translate-y-1/2">
        {type === 'patient' ? (
          // Line pointing left to node
          <div 
            className="w-4 h-0.5 bg-blue-300 -left-4 absolute"
            style={{ left: '-16px' }}
          />
        ) : (
          // Line pointing right to node  
          <div 
            className="w-4 h-0.5 bg-green-300 -right-4 absolute"
            style={{ right: '-16px' }}
          />
        )}
      </div>
    </div>
  );
});

TimelineCard.displayName = 'TimelineCard';

export { TimelineCard };
