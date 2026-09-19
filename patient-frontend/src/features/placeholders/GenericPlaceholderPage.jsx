import React from 'react';
import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

export const GenericPlaceholderPage = ({ title, description, roles = [] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{description}</p>
      </div>

      <div className="glass-panel" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', margin: '0 auto 1rem auto' }}>
          <Construction size={30} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {title} Feature Module Scaffolding
        </h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
          This feature module is active. Operational workflows are managed through your authorized dashboard and role permissions.
        </p>
      </div>
    </motion.div>
  );
};

export default GenericPlaceholderPage;
