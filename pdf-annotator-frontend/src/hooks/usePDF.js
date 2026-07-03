import { useState } from 'react';
import { pdfAPI } from '../services/api/pdf';
import toast from 'react-hot-toast';

export const usePDF = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadPDF = async (file) => {
    try {
      setLoading(true);
      const response = await pdfAPI.upload(file, setUploadProgress);
      if (response.success) {
        toast.success('PDF uploaded successfully!');
        return { success: true, data: response.data };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
      return { success: false, error };
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const getAllPDFs = async (params) => {
    try {
      setLoading(true);
      const response = await pdfAPI.getAll(params);
      if (response.success) {
        setPdfs(response.data.pdfs);
        return response.data;
      }
    } catch (error) {
      toast.error('Failed to load PDFs');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deletePDF = async (uuid) => {
    try {
      const response = await pdfAPI.delete(uuid);
      if (response.success) {
        setPdfs(pdfs.filter(pdf => pdf.uuid !== uuid));
        toast.success('PDF deleted successfully');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to delete PDF');
      return { success: false, error };
    }
  };

  const renamePDF = async (uuid, displayName) => {
    try {
      const response = await pdfAPI.update(uuid, { displayName });
      if (response.success) {
        setPdfs(pdfs.map(pdf =>
          pdf.uuid === uuid ? { ...pdf, displayName } : pdf
        ));
        toast.success('PDF renamed');
        return { success: true };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to rename PDF');
      return { success: false, error };
    }
  };

  const toggleFavorite = async (uuid) => {
    try {
      const response = await pdfAPI.toggleFavorite(uuid);
      if (response.success) {
        setPdfs(pdfs.map(pdf =>
          pdf.uuid === uuid ? { ...pdf, isFavorite: !pdf.isFavorite } : pdf
        ));
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to update favorite');
      return { success: false };
    }
  };

  const toggleArchive = async (uuid) => {
    try {
      const response = await pdfAPI.toggleArchive(uuid);
      if (response.success) {
        // Remove from the current list (it moves in/out of the archived view)
        setPdfs(pdfs.filter(pdf => pdf.uuid !== uuid));
        toast.success('PDF updated');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to archive PDF');
      return { success: false };
    }
  };

  return {
    pdfs,
    loading,
    uploadProgress,
    uploadPDF,
    getAllPDFs,
    deletePDF,
    renamePDF,
    toggleFavorite,
    toggleArchive,
  };
};