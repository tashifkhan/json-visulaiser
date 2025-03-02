import React, { useState, useCallback, FC, ReactNode } from 'react';
// import { FileUpload } from 'lucide-react';

// Define types for our component props and data
type JsonValue = 
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface TreeNodeProps {
  data: JsonValue;
  name?: string | number;
  isRoot?: boolean;
}

const JsonVisualizer: FC = () => {
  const [jsonData, setJsonData] = useState<JsonValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  
  // Parse the JSON input and handle errors
  const parseJson = useCallback((input: string): boolean => {
    try {
      const parsed: JsonValue = JSON.parse(input);
      setJsonData(parsed);
      setError(null);
      return true;
    } catch (err) {
      setError(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, []);
  
  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setTextInput(content);
        parseJson(content);
      }
    };
    reader.readAsText(file);
  }, [parseJson]);
  
  // Handle text input
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    parseJson(textInput);
  }, [textInput, parseJson]);
  
  // TreeNode component for rendering JSON data recursively
  const TreeNode: FC<TreeNodeProps> = ({ data, name, isRoot = false }) => {
    const [isOpen, setIsOpen] = useState<boolean>(isRoot);
    
    const getType = (value: JsonValue): string => {
      if (Array.isArray(value)) return 'array';
      if (value === null) return 'null';
      return typeof value;
    };
    
    const getNodeCount = (value: JsonValue): number => {
      if (Array.isArray(value)) return value.length;
      if (typeof value === 'object' && value !== null) return Object.keys(value).length;
      return 0;
    };
    
    const type = getType(data);
    const isExpandable = ['object', 'array'].includes(type) && data !== null;
    const nodeCount = isExpandable ? getNodeCount(data) : 0;
    
    // Colors for different types
    const typeColors: Record<string, string> = {
      string: 'text-green-600',
      number: 'text-blue-600',
      boolean: 'text-purple-600',
      null: 'text-gray-500',
      object: 'text-gray-800',
      array: 'text-gray-800',
    };
    
    return (
      <div className="ml-4">
        <div className="flex items-center">
          {isExpandable && (
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="w-4 mr-1 focus:outline-none"
              type="button"
            >
              {isOpen ? '▼' : '►'}
            </button>
          )}
          
          <span className="font-medium">
            {name !== undefined && (
              <span className="text-red-600">{`"${name}": `}</span>
            )}
            
            {isExpandable ? (
              <span className={typeColors[type]}>
                {type === 'array' ? '[' : '{'}
                <span className="text-gray-500 text-sm ml-1">
                  {nodeCount} {nodeCount === 1 ? 'item' : 'items'}
                </span>
                {!isOpen && (type === 'array' ? ' ... ]' : ' ... }')}
              </span>
            ) : (
              <span className={typeColors[type]}>
                {type === 'string' ? `"${data}"` : 
                 type === 'null' ? 'null' : 
                 String(data)}
              </span>
            )}
          </span>
        </div>
        
        {isOpen && isExpandable && (
          <div className="ml-2 border-l-2 border-gray-200 pl-2">
            {type === 'object' && data !== null ? (
              Object.keys(data as Record<string, JsonValue>).map((key) => (
                <TreeNode 
                  key={key} 
                  data={(data as Record<string, JsonValue>)[key]} 
                  name={key}
                />
              ))
            ) : (
              Array.isArray(data) && data.map((item, index) => (
                <TreeNode 
                  key={index} 
                  data={item} 
                  name={index}
                />
              ))
            )}
          </div>
        )}
        
        {isOpen && isExpandable && (
          <div className="ml-4">
            <span className={typeColors[type]}>
              {type === 'array' ? ']' : '}'}
            </span>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">JSON Visualizer</h1>
      
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Paste JSON or upload a file
            </label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              value={textInput}
              onChange={handleTextChange}
              placeholder='{"example": "Paste your JSON here"}'
            />
          </div>
          
          <div className="flex space-x-4">
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded flex items-center"
              >
                {/* <FileUpload size={16} className="mr-2" /> */}
                Upload JSON
              </button>
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Visualize
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
        </form>
      </div>
      
      {jsonData && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">JSON Tree</h2>
          <div className="overflow-auto">
            <TreeNode data={jsonData} isRoot={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonVisualizer;