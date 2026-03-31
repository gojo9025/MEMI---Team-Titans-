"use client";

export default function AnnouncementForm({ formData, setFormData }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const inputStyle = {
        width: '100%',
        padding: '0.8rem 1rem',
        borderRadius: '8px',
        border: '1px solid var(--panel-border)',
        background: 'rgba(0, 0, 0, 0.2)',
        color: 'var(--foreground)',
        fontSize: '1rem',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 0.2s',
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '0.5rem',
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
        fontWeight: '500'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
                <label style={labelStyle}>Announcement Title</label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. End of Semester Exams"
                    style={inputStyle}
                />
            </div>

            <div>
                <label style={labelStyle}>Details / Context</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter the formal announcement text here. The AI will turn this into a funny, shareable meme caption."
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>Date/Deadline</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        style={inputStyle}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Category</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        style={inputStyle}
                    >
                        <option value="Event">Event</option>
                        <option value="Exam">Exam / Deadline</option>
                        <option value="Urgent">Urgent Alert</option>
                        <option value="General">General Info</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
