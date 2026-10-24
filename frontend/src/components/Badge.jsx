import React from 'react';

export const Badge = ({ status, type = 'status', children }) => {
  const normalized = (status || children || '').toLowerCase();

  let badgeClass = 'badge ';

  if (type === 'role') {
    badgeClass += normalized === 'leader' ? 'badge-leader' : 'badge-member';
  } else {
    switch (normalized) {
      case 'upcoming':
        badgeClass += 'badge-upcoming';
        break;
      case 'ongoing':
        badgeClass += 'badge-ongoing';
        break;
      case 'completed':
        badgeClass += 'badge-completed';
        break;
      case 'evaluated':
        badgeClass += 'badge-evaluated';
        break;
      case 'pending':
        badgeClass += 'badge-pending';
        break;
      default:
        badgeClass += 'badge-completed';
    }
  }

  return (
    <span className={badgeClass}>
      {children || status}
    </span>
  );
};
