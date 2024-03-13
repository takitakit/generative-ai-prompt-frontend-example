'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';

export default function Chat() {
  const [systemInput, setSystemInput] = useState(''); // Systemプロンプトの状態管理
  const [userInput, setUserInput] = useState('')
  const [copyCaption, setCopyCaption] = useState('Copy'); // Copyボタンのキャプションを管理するための状態

  const [loadingStartTime, setLoadingStartTime] = useState<number>(0); // ローディング開始時刻を保持するためのステート
  const [loadingTime, setLoadingTime] = useState<number>(0); 

  const getModelFromURL = () => {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get('model') || 'gpt4-turbo'; // デフォルト値を指定
  };
  const [model, setModel] = useState<string>('gpt4-turbo'); // 新しい状態でモデルを管理
  useEffect(() => {
    // コンポーネントのマウント時にURLからモデルを読み込む
    setModel(getModelFromURL());
  }, []);

  const apiPathMap = {
    'gpt3.5-turbo': '/api/gpt3',
    'gpt4-turbo': '/api/gpt4',
    'claude3-opus': '/api/claude3-opus',
    'claude3-sonnet': '/api/claude3-sonnet',
    'gemini1-pro': '/api/gemini1-pro',
  }

  let apiPath = '';
  if (model in apiPathMap) {
    apiPath = apiPathMap[model as keyof typeof apiPathMap];
  } else {
    apiPath = 'api/gpt4'; // 既定値
  }
  const { messages, input, setInput, handleInputChange, setMessages, handleSubmit: origHandleSubmit, isLoading, error } = useChat({api: apiPath} );


  useEffect(() => {
    if (isLoading) {
      setLoadingTime (0)
      setLoadingStartTime(Date.now()); // isLoadingがtrueになった瞬間の時刻を記録
    } else if (loadingStartTime !== 0) {
      setLoadingTime(Date.now() - loadingStartTime); // isLoadingがfalseになった時、かかった時間を計算
      setLoadingStartTime(0); // 次の計測のために開始時刻をリセット
    }
  }, [isLoading]); // isLoadingが変更されるたびにこの効果を実行


  const handleSystemInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemInput(e.target.value);
    // handleInputChange(e);
    // setInput(input)
  };
  const handleUserInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
    // setInput(e.target.value)
    handleInputChange(e);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // フォームのデフォルト動作を防止
    if (userInput.trim() === '' || isLoading) return; // ユーザー入力が空の場合は何もしない

    console.log('userInput', userInput);

    setInput(userInput);  

    if (systemInput.trim() !== '') { 
      setMessages([
        { id: '1', role: 'system', content: systemInput },
      ]);
    } else {
      setMessages([]);
    }
    
    origHandleSubmit(e);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedModel = e.target.value;
    // URLのクエリパラメータを更新
    const newURL = new URL(window.location.href);
    newURL.searchParams.set('model', selectedModel);
    window.location.href = newURL.href; // ページをリロード
  };

  const handleCopy = async () => {
    const chatText = messages.filter(m => m.role === 'assistant').map(m => m.content).join('\n');
    await navigator.clipboard.writeText(chatText);
    setCopyCaption('✔️Copied!'); // キャプションを更新
    setTimeout(() => {
      setCopyCaption('Copy'); // 3秒後にキャプションを元に戻す
    }, 3000);
  };

  return (
    <div className="flex flex-col py-10 mx-10">
      <h2>Open AI Completions</h2>

      <label htmlFor="model-select" className="block mb-2">Model</label>
      <select
        id="model-select"
        className="w-full p-2 border border-gray-300 rounded shadow-xl"
        value={model}
        onChange={handleModelChange}
      >
        <option value="gpt4-turbo">gpt4-turbo</option>
        <option value="gpt3.5-turbo">gpt3.5-turbo</option>
        <option value="claude3-opus">claude3-opus</option>
        <option value="claude3-sonnet">claude3-sonnet</option>
        <option value="gemini1-pro">gemini1-pro</option>
      </select>

      <form onSubmit={handleSubmit} className="mt-2">
        <label>Systemプロンプト</label>
        <textarea
          className="w-full p-2 mb-2 border border-gray-300 rounded shadow-xl resize-vertical"
          value={systemInput}
          onChange={handleSystemInputChange}
          disabled={model === 'gemini1-pro'}
          placeholder={model === 'gemini1-pro' ? 'Gemini1 ProはSystemプロンプトをサポートしていません' : ''}
          rows={4}
        />

        <label>Userプロンプト</label>
        <textarea
          className="w-full p-2 mb-2 border border-gray-300 rounded shadow-xl resize-vertical"
          value={userInput}
          onChange={handleUserInputChange}
          rows={10}
        />
        <button type="submit" disabled={isLoading} className={`w-full bg-blue-500 text-white p-2 rounded mt-2 ${isLoading ? 'disabled:bg-gray-300': ''}`}>Send</button>
      </form>

      {error && (
        <div className="text-red-500 mt-12">{error.message}</div>
      )}

      {messages.length > 0 && (
        <div className="relative">
          <div className="flex my-20 p-3 border border-1 rounded-md">
            {messages.map(m => (
              <div key={m.id} className={`${m.role === 'system' || m.role === 'user' ? 'hidden' : ''} whitespace-pre-wrap`}>
                {m.content}
              </div>
            ))}
          </div>
          {loadingTime > 0 && (
            <label className="absolute top-0 left-0 mt-12 ml-2">Response: {loadingTime} msec</label>
          )}
          <button type="button" onClick={handleCopy} className="absolute top-0 right-0 mt-12 mr-2">{copyCaption}</button>
        </div>
      )}
    </div>
  );
}
