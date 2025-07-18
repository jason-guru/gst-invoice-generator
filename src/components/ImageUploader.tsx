import React, { useState } from 'react';

const ImageUploader = () => {
    const [base64Image, setBase64Image] = useState('');
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file: File | undefined = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setBase64Image(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
        <input 
            type="file" 
            accept="image/jpeg,image/jpg" 
            onChange={handleImageUpload} 
        />
        {base64Image && (
            <div>
            <img src={base64Image} alt="Uploaded" style={{ maxWidth: '300px' }} />
            <textarea 
                value={base64Image} 
                readOnly 
                style={{ width: '100%', height: '100px' }}
            />
            </div>
        )}
        </div>
    );
};
export default ImageUploader;
