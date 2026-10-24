import React from 'react';

export const StatCard = ({ icon: Icon, value, label }) => {
  return (
    <div className="stat-card">
      {Icon && (
        <div className="stat-icon">
          <Icon size={24} />
        </div>
      )}
      <div className="stat-details">
        <span className="stat-value">{value ?? 0}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
};
