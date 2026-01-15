import React from 'react';
import './Loader.css';

const Loader = ({ text = 'Loading...' }) => {
    return (
        <div className="loader-container">
            <div className="loader-spinner"></div>
            {text && <div className="loader-text">{text}</div>}
        </div>
    );
};

export default Loader;
