import React from 'react';
import Modal from './Modal';

const ConfirmDialog = ({ isOpen, title='Confirm', message, onConfirm, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-2">
        <p className="text-sm text-gray-700">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100 text-gray-700">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
