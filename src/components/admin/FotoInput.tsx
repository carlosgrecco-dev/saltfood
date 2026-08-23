import React, { useRef, useState } from 'react';
import { Upload, Loader2, ImageOff } from 'lucide-react';
import { uploadImagem } from '../../lib/upload';

interface FotoInputProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

/** Campo de imagem reutilizado em todo o admin — aceita colar uma URL ou enviar um arquivo do PC (os dois escrevem no mesmo valor). */
const FotoInput: React.FC<FotoInputProps> = ({ value, onChange, placeholder = 'URL da imagem (opcional)' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setErro('');
    setEnviando(true);
    try {
      const url = await uploadImagem(file);
      onChange(url);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar imagem');
    } finally {
      setEnviando(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {value ? (
          <img src={value} alt="Prévia" className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
            <ImageOff className="h-4 w-4 text-gray-300" />
          </div>
        )}
        <input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-0"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={enviando}
          className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-2 rounded-lg shrink-0 disabled:opacity-60"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {enviando ? 'Enviando...' : 'Enviar do PC'}
        </button>
      </div>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
};

export default FotoInput;
