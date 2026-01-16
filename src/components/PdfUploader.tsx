'use client';

import { useState } from 'react';

export default function PdfUploader() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                setError('Por favor, selecione um arquivo PDF');
                return;
            }
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
                setError('Arquivo muito grande. Máximo: 10MB');
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/chat-ia', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Erro ao processar PDF');
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao processar arquivo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6">
                    📄 Upload de PDF para Resumo com IA
                </h2>

                {/* Upload Area */}
                <div className="mb-6">
                    <label
                        htmlFor="pdf-upload"
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        {!file ? (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg
                                    className="w-10 h-10 mb-3 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Clique para fazer upload</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    Apenas arquivos PDF (Máx: 10MB)
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <svg
                                    className="w-16 h-16 mb-3 text-blue-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <p className="text-sm font-medium text-gray-700">
                                    {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        )}
                        <input
                            id="pdf-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,application/pdf"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">❌ {error}</p>
                    </div>
                )}

                {/* Upload Button */}
                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Processando PDF...
                        </span>
                    ) : (
                        '🤖 Gerar Resumo com IA'
                    )}
                </button>

                {/* Result */}
                {result && (
                    <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="text-lg font-bold mb-4 text-green-800">
                            ✅ PDF Processado com Sucesso!
                        </h3>

                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="text-gray-600">
                                    <strong>Arquivo:</strong> {result.fileName}
                                </p>
                                <p className="text-gray-600">
                                    <strong>Páginas:</strong> {result.pageCount}
                                </p>
                                <p className="text-gray-600">
                                    <strong>Caracteres:</strong>{' '}
                                    {result.textLength.toLocaleString()}
                                </p>
                            </div>

                            <div className="mt-4">
                                <h4 className="font-bold text-gray-800 mb-2">
                                    📋 Resumo Gerado pela IA:
                                </h4>
                                <div className="bg-white p-4 rounded border border-gray-200 max-h-96 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                                        {result.summary}
                                    </pre>
                                </div>
                            </div>

                            {result.fullText && (
                                <details className="mt-4">
                                    <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800">
                                        📄 Ver texto extraído (primeiros 5000 caracteres)
                                    </summary>
                                    <div className="mt-2 p-4 bg-white rounded border border-gray-200 max-h-64 overflow-y-auto">
                                        <pre className="whitespace-pre-wrap text-xs text-gray-600">
                                            {result.fullText}
                                        </pre>
                                    </div>
                                </details>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-3">
                    💡 Como usar:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                    <li>Clique na área de upload ou arraste um arquivo PDF</li>
                    <li>Aguarde o processamento (pode levar alguns segundos)</li>
                    <li>Receba um resumo estruturado gerado pela IA</li>
                    <li>
                        Use o resumo para análises rápidas de documentos extensos
                    </li>
                </ol>
            </div>
        </div>
    );
}
