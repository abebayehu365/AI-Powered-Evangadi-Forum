import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Sparkles,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  File,
  Layers,
} from 'lucide-react';
import { ragService } from '../../services/rag/rag.service';
import RagAnswerBody from '../../components/RagAnswerBody/RagAnswerBody';
import styles from './RagDocuments.module.css';

export default function RagDocuments() {
  const fileInputRef = useRef(null);

  // Document list state
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docsError, setDocsError] = useState(null);

  // Active document selection
  const [activeDoc, setActiveDoc] = useState(null);
  const activeDocId = activeDoc?.id || activeDoc?.documentId;
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [deletingDocument, setDeletingDocument] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const cancelDeleteRef = useRef(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [draggingFile, setDraggingFile] = useState(false);
  const dragDepthRef = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  // Semantic search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Ask AI state
  const [aiQuestion, setAiQuestion] = useState('');
  const [askingAi, setAskingAi] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Fetch documents list on mount
  const fetchDocuments = useCallback(async () => {
    setLoadingDocs(true);
    setDocsError(null);
    try {
      const list = await ragService.listDocuments();
      setDocuments(list);
      // Auto-select first document if none active
      if (list.length > 0) {
        setActiveDoc(current => current || list[0]);
      }
    } catch (err) {
      console.error('Failed to list RAG documents:', err);
      setDocsError(err.message || 'Unable to load documents from knowledge base.');
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (!documentToDelete) return;
    cancelDeleteRef.current?.focus();
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !deletingDocument) {
        setDocumentToDelete(null);
        setDeleteError(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [documentToDelete, deletingDocument]);

  // Load PDF Object URL when active document changes
  useEffect(() => {
    let cancelled = false;
    let currentUrl = null;
    if (activeDocId) {
      setPdfLoading(true);
      setPdfUrl(null);
      setPdfError(null);
      setSearchResults(null);
      setAiAnswer(null);
      setSearchError(null);
      setAiError(null);

      ragService
        .fetchPdfObjectUrl(activeDocId)
        .then(url => {
          currentUrl = url;
          if (cancelled) {
            if (url) URL.revokeObjectURL(url);
            return;
          }
          setPdfUrl(url);
        })
        .catch(err => {
          if (!cancelled) {
            setPdfError(err.message || 'Unable to load the PDF preview.');
          }
        })
        .finally(() => {
          if (!cancelled) setPdfLoading(false);
        });
    } else {
      setPdfUrl(null);
      setPdfError(null);
      setPdfLoading(false);
    }

    return () => {
      cancelled = true;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [activeDocId]);

  // File selection and drop share the same PDF validation.
  const selectPdfFile = file => {
    setUploadError(null);
    setUploadSuccess(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF documents are supported.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = e => {
    selectPdfFile(e.target.files?.[0]);
  };

  const handleDragEnter = event => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setDraggingFile(true);
  };

  const handleDragOver = event => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = event => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDraggingFile(false);
  };

  const handleFileDrop = event => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setDraggingFile(false);
    if (uploading) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) selectPdfFile(file);
  };

  // Upload file
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // Upload returns immediately with status: 'processing'
      const newDoc = await ragService.uploadPdf(selectedFile);
      setUploadSuccess(`"${selectedFile.name}" uploaded! Processing in background…`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Add doc to list immediately so user sees it
      setDocuments(prev => [newDoc, ...prev]);
      setActiveDoc(newDoc);
      setUploading(false);

      // Poll every 3s until status changes to 'ready' or 'failed'
      ragService.pollDocumentStatus(newDoc.id, updatedDoc => {
        setDocuments(prev =>
          prev.map(d => (d.id === updatedDoc.id ? updatedDoc : d)),
        );
        if (updatedDoc.id === newDoc.id) {
          setActiveDoc(updatedDoc);
        }
      }).then(finalDoc => {
        setDocuments(prev =>
          prev.map(d => (d.id === finalDoc.id ? finalDoc : d)),
        );
        setActiveDoc(finalDoc);
        if (finalDoc.status === 'ready') {
          setUploadSuccess(`"${finalDoc.title}" is ready!`);
        } else {
          setUploadError(`Processing failed: ${finalDoc.error_message || 'Unknown error'}`);
        }
      }).catch(err => {
        setUploadError(err.message);
      });
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload document.');
      setUploading(false);
    }
  };

  const handleDeleteDoc = (e, doc) => {
    e.stopPropagation();
    setDeleteError(null);
    setDocumentToDelete(doc);
  };

  const confirmDeleteDoc = async () => {
    if (!documentToDelete || deletingDocument) return;
    const docId = documentToDelete.id || documentToDelete.documentId;
    setDeletingDocument(true);

    try {
      await ragService.deleteDocument(docId);
      const remaining = documents.filter(d => (d.id || d.documentId) !== docId);
      setDocuments(remaining);
      if ((activeDoc?.id || activeDoc?.documentId) === docId) {
        setActiveDoc(remaining[0] || null);
      }
      setDocumentToDelete(null);
    } catch (err) {
      console.error('Failed to delete PDF:', err);
      setDeleteError(err.message || 'Failed to delete document. Please try again.');
    } finally {
      setDeletingDocument(false);
    }
  };

  // Perform Semantic Search in Document
  const handleSearchSubmit = async e => {
    e.preventDefault();
    if (!searchQuery.trim() || !activeDoc) return;
    setSearching(true);
    setSearchError(null);

    try {
      const results = await ragService.searchInDocument(
        activeDoc.id || activeDoc.documentId,
        searchQuery.trim(),
      );
      setSearchResults(results);
    } catch (err) {
      console.error('Search in document error:', err);
      setSearchError(err.message || 'Semantic search encountered an error.');
    } finally {
      setSearching(false);
    }
  };

  // Ask AI about Document
  const handleAskSubmit = async e => {
    e.preventDefault();
    if (!aiQuestion.trim() || !activeDoc) return;
    setAskingAi(true);
    setAiError(null);

    try {
      const response = await ragService.queryDocument(
        activeDoc.id || activeDoc.documentId,
        aiQuestion.trim(),
      );
      setAiAnswer(response.answer);
    } catch (err) {
      console.error('Ask AI error:', err);
      setAiError(err.message || 'Could not get an answer.');
    } finally {
      setAskingAi(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Header Card */}
      <section className={styles.headerCard} aria-labelledby='rag-header-title'>
        <span className={styles.headerEyebrow}>KNOWLEDGE BASE</span>
        <h1 id='rag-header-title' className={styles.headerTitle}>
          Private PDF library
        </h1>
        <p className={styles.headerDesc}>
          Upload study or reference PDFs to your own workspace. Each file is indexed for
          semantic search and optional AI answers that cite passages from that document
          only. File size limits apply on the server; other users never see your uploads.
        </p>
      </section>

      {/* Two Column Layout */}
      <div className={styles.layoutColumns}>
        {/* Left Column: Library */}
        <aside className={styles.libraryColumn} aria-label='Document Library'>
          <div className={styles.libraryCard}>
            <div className={styles.libraryHeader}>
              <h2 className={styles.libraryTitle}>Library</h2>
              <p className={styles.librarySubtitle}>
                Add PDFs here. Processing runs once per upload.
              </p>
            </div>

            {/* Upload Dropzone Box */}
            <div
              className={`${styles.uploadBox} ${draggingFile ? styles.uploadBoxDragging : ''}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleFileDrop}
              role='region'
              aria-label='PDF upload drop area'
            >
              <p className={styles.dropPrompt}>
                <Upload size={18} aria-hidden='true' />
                <span>Drag and drop a PDF here, or choose a file</span>
              </p>
              <p className={styles.uploadPolicy}>
                Accepted format: PDF. Maximum file size: 6 MB.
              </p>

              <input
                type='file'
                ref={fileInputRef}
                accept='.pdf,application/pdf'
                onChange={handleFileChange}
                className={styles.hiddenFileInput}
                id='pdf-upload-input'
              />

              <div className={styles.uploadActions}>
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.chooseFileBtn}
                  disabled={uploading}
                >
                  <FileText size={16} />
                  Choose file
                </button>

                <button
                  type='button'
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className={styles.uploadBtn}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload
                    </>
                  )}
                </button>
              </div>

              <span className={styles.selectedFileText}>
                {selectedFile ? selectedFile.name : 'No file selected.'}
              </span>

              {uploadError && (
                <div className={styles.uploadErrorText}>
                  <AlertCircle size={14} />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className={styles.uploadSuccessText}>
                  <CheckCircle2 size={14} />
                  <span>{uploadSuccess}</span>
                </div>
              )}
            </div>

            {/* Document List */}
            <div className={styles.docListSection}>
              {loadingDocs && (
                <div className={styles.docLoading}>
                  <Loader2 size={20} className={styles.spinner} />
                  <span>Loading library...</span>
                </div>
              )}

              {docsError && (
                <div className={styles.docListError}>
                  <AlertCircle size={16} />
                  <span>{docsError}</span>
                </div>
              )}

              {!loadingDocs && documents.length === 0 && (
                <div className={styles.emptyDocList}>
                  <File size={28} className={styles.emptyDocIcon} />
                  <span>No documents uploaded yet.</span>
                </div>
              )}

              {!loadingDocs && documents.length > 0 && (
                <div className={styles.docList}>
                  {documents.map(doc => {
                    const docId = doc.id || doc.documentId;
                    const isSelected =
                      (activeDoc?.id || activeDoc?.documentId) === docId;
                    const status = (doc.status || 'ready').toUpperCase();

                    return (
                      <div
                        key={docId}
                        onClick={() => setActiveDoc(doc)}
                        className={`${styles.docItem} ${
                          isSelected ? styles['docItem--active'] : ''
                        }`}
                        role='button'
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setActiveDoc(doc);
                          }
                        }}
                      >
                        <div className={styles.docItemInfo}>
                          <span className={styles.docItemTitle}>
                            {doc.title || doc.filename || 'Untitled document'}
                          </span>
                          <span
                            className={`${styles.statusBadge} ${
                              status === 'READY'
                                ? styles['statusBadge--ready']
                                : styles['statusBadge--processing']
                            }`}
                          >
                            {status}
                          </span>
                        </div>

                        <button
                          type='button'
                          onClick={e => handleDeleteDoc(e, doc)}
                          className={styles.deleteDocBtn}
                          title='Delete document'
                          aria-label={`Delete ${doc.title || doc.filename}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Column: Active Document View */}
        <main className={styles.activeColumn} aria-label='Active Document Content'>
          {!activeDoc ? (
            <div className={styles.noSelectionCard}>
              <Layers size={36} className={styles.noSelectionIcon} />
              <p className={styles.noSelectionText}>
                Choose a document from the library to open the reader, run semantic
                search over its text, and ask questions with AI-assisted answers grounded
                in that file.
              </p>
            </div>
          ) : (
            <div className={styles.activeContentWrap}>
              {/* Section 1: Reader (PDF Preview) */}
              <section className={styles.sectionCard} aria-labelledby='reader-heading'>
                <div className={styles.sectionHeader}>
                  <h2 id='reader-heading' className={styles.sectionTitle}>
                    Reader
                  </h2>
                  <p className={styles.sectionDesc}>
                    Inline preview of the selected PDF.
                  </p>
                </div>

                <div className={styles.previewContainer}>
                  {pdfLoading && (
                    <div className={styles.previewLoading}>
                      <Loader2 size={24} className={styles.spinner} />
                      <span>Loading PDF preview...</span>
                    </div>
                  )}

                  {!pdfLoading && pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      title={activeDoc.title || 'PDF Document'}
                      className={styles.pdfIframe}
                    />
                  ) : !pdfLoading && pdfError ? (
                    <div className={styles.previewPlaceholder} role='alert'>
                      <AlertCircle size={40} className={styles.previewErrorIcon} />
                      <strong className={styles.placeholderTitle}>
                        PDF preview unavailable
                      </strong>
                      <p className={styles.placeholderSub}>{pdfError}</p>
                    </div>
                  ) : !pdfLoading ? (
                    <div className={styles.previewPlaceholder}>
                      <FileText size={40} className={styles.placeholderIcon} />
                      <strong className={styles.placeholderTitle}>
                        {activeDoc.title || activeDoc.filename}
                      </strong>
                      <p className={styles.placeholderSub}>
                        The PDF preview could not be loaded. You can still run semantic
                        search and ask questions below.
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>

              {/* Section 2: Semantic Search */}
              <section className={styles.sectionCard} aria-labelledby='search-heading'>
                <div className={styles.sectionHeader}>
                  <h2 id='search-heading' className={styles.sectionTitle}>
                    Semantic search
                  </h2>
                  <p className={styles.sectionDesc}>
                    Finds passages by meaning (embeddings), not only exact keywords.
                  </p>
                </div>

                <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                  <label htmlFor='rag-search-input' className={styles.inputLabel}>
                    Search query
                  </label>
                  <div className={styles.searchInputRow}>
                    <input
                      id='rag-search-input'
                      type='text'
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder='Describe the topic or phrase you are looking for'
                      className={styles.textInput}
                    />
                    <button
                      type='submit'
                      disabled={searching || !searchQuery.trim()}
                      className={styles.primaryActionBtn}
                    >
                      {searching ? (
                        <>
                          <Loader2 size={16} className={styles.spinner} />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Search
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {searchError && (
                  <div className={styles.errorAlert} role='alert'>
                    <AlertCircle size={16} />
                    <span>{searchError}</span>
                  </div>
                )}

                {/* Search Results */}
                {searchResults && (
                  <div className={styles.searchResultsList}>
                    <h3 className={styles.resultsHeading}>
                      Relevant Excerpts ({searchResults.length})
                    </h3>
                    {searchResults.length === 0 ? (
                      <p className={styles.noResultsText}>
                        No matching passages found in this document.
                      </p>
                    ) : (
                      searchResults.map((result, idx) => (
                        <div key={idx} className={styles.excerptCard}>
                          <div className={styles.excerptHeader}>
                            {result.chunkIndex != null && (
                              <span className={styles.pageBadge}>
                                Chunk {result.chunkIndex + 1}
                              </span>
                            )}
                            {(result.score ?? result.similarity) != null && (
                              <span className={styles.similarityBadge}>
                                {Math.round((result.score ?? result.similarity) * 100)}% match
                              </span>
                            )}
                          </div>
                          <p className={styles.excerptContent}>
                            {result.excerpt || result.content || result.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>

              {/* Section 3: Ask with AI */}
              <section className={styles.sectionCard} aria-labelledby='ask-ai-heading'>
                <div className={styles.sectionHeader}>
                  <h2 id='ask-ai-heading' className={styles.sectionTitle}>
                    Ask with AI
                  </h2>
                  <p className={styles.sectionDesc}>
                    Answers use only retrieved excerpts from this PDF, with citations
                    where possible. When the document includes code, the reply may show
                    it in formatted blocks you can copy.
                  </p>
                </div>

                <form onSubmit={handleAskSubmit} className={styles.askForm}>
                  <label htmlFor='rag-ai-input' className={styles.inputLabel}>
                    Question
                  </label>
                  <textarea
                    id='rag-ai-input'
                    rows={4}
                    value={aiQuestion}
                    onChange={e => setAiQuestion(e.target.value)}
                    placeholder='What does this PDF recommend for route persistence?'
                    className={styles.textareaInput}
                  />

                  <div className={styles.askActionRow}>
                    <button
                      type='submit'
                      disabled={askingAi || !aiQuestion.trim()}
                      className={styles.primaryActionBtn}
                    >
                      {askingAi ? (
                        <>
                          <Loader2 size={16} className={styles.spinner} />
                          Generating answer...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Ask
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {aiError && (
                  <div className={styles.errorAlert} role='alert'>
                    <AlertCircle size={16} />
                    <span>{aiError}</span>
                  </div>
                )}

                {/* AI Answer Display */}
                {aiAnswer && (
                  <div className={styles.aiAnswerCard}>
                    <div className={styles.aiAnswerHeader}>
                      <Sparkles size={18} className={styles.aiAnswerSparkle} />
                      <strong className={styles.aiAnswerTitle}>
                        Grounded AI Response:
                      </strong>
                    </div>
                    <div className={styles.aiAnswerBody}>
                      <RagAnswerBody>{aiAnswer}</RagAnswerBody>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {documentToDelete && (
        <div
          className={styles.deleteDialogBackdrop}
          onClick={event => {
            if (event.target === event.currentTarget && !deletingDocument) {
              setDocumentToDelete(null);
              setDeleteError(null);
            }
          }}
          role='dialog'
          aria-modal='true'
          aria-labelledby='delete-pdf-title'
          aria-describedby='delete-pdf-description'
        >
          <div className={styles.deleteDialog}>
            <div className={styles.deleteDialogIcon}>
              <Trash2 size={21} />
            </div>
            <p className={styles.deleteDialogEyebrow}>Permanent action</p>
            <h2 id='delete-pdf-title' className={styles.deleteDialogTitle}>
              Remove this PDF?
            </h2>
            <p id='delete-pdf-description' className={styles.deleteDialogText}>
              This PDF and its indexed content will be removed from your workspace.
              This action cannot be undone.
            </p>
            <div className={styles.deleteDialogFile}>
              <FileText size={20} className={styles.deleteDialogFileIcon} />
              <span className={styles.deleteDialogFileName}>
                {documentToDelete.title ||
                  documentToDelete.filename ||
                  'Untitled PDF'}
              </span>
            </div>
            {deleteError && (
              <p className={styles.deleteDialogError} role='alert'>
                {deleteError}
              </p>
            )}
            <div className={styles.deleteDialogActions}>
              <button
                ref={cancelDeleteRef}
                type='button'
                className={styles.cancelDeleteBtn}
                disabled={deletingDocument}
                onClick={() => {
                  setDocumentToDelete(null);
                  setDeleteError(null);
                }}
              >
                Cancel
              </button>
              <button
                type='button'
                className={styles.confirmDeleteBtn}
                disabled={deletingDocument}
                onClick={confirmDeleteDoc}
              >
                {deletingDocument ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Remove PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
