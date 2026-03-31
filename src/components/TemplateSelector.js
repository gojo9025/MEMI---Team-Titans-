"use client";

export default function TemplateSelector({ templates, selectedTemplate, setSelectedTemplate }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '1rem'
        }}>
            {templates.map(template => {
                const isSelected = selectedTemplate.id === template.id;
                return (
                    <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        style={{
                            cursor: 'pointer',
                            borderRadius: '8px',
                            border: `2px solid ${isSelected ? 'var(--accent-blue)' : 'var(--panel-border)'}`,
                            overflow: 'hidden',
                            transition: 'all 0.2s ease',
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: isSelected ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none',
                            filter: isSelected ? 'brightness(1)' : 'brightness(0.7)',
                        }}
                    >
                        {/* Using regular img for external urls instead of next/image for simplicity */}
                        <img
                            src={template.url}
                            alt={template.name}
                            style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{
                            padding: '0.4rem',
                            fontSize: '0.7rem',
                            textAlign: 'center',
                            background: 'var(--panel-bg)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {template.name}
                        </div>
                    </div>
                )
            })}
        </div>
    );
}
