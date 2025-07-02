
import React from 'react';
import { Post, InstagramAccount, PostType } from '../types';

interface PostPreviewProps {
  post: Partial<Post>;
  account: InstagramAccount;
}

const PostPreview: React.FC<PostPreviewProps> = ({ post, account }) => {
  const { type = PostType.Feed, mediaUrl, caption } = post;
  const isReel = type === PostType.Reel;

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-black rounded-3xl">
      <div 
        className={`relative bg-gray-900 overflow-hidden shadow-2xl transition-all duration-300 ${isReel ? 'w-[280px] h-[498px]' : 'w-[320px] h-[480px]'} rounded-[40px] border-4 border-gray-700`}
      >
        {/* Phone Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-20"></div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between bg-black/30 backdrop-blur-sm z-10">
          <div className="flex items-center">
            <img src={account.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border-2 border-purple-500" />
            <span className="ml-2 font-bold text-sm text-white">{account.username}</span>
          </div>
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
        </div>

        {/* Media */}
        <div className={`absolute top-0 left-0 w-full h-full flex items-center justify-center ${isReel ? '' : 'pt-[44px]'}`}>
          {mediaUrl ? (
            <img src={mediaUrl} alt="Post preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-gray-500">
              <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <span className="text-sm">画像プレビュー</span>
            </div>
          )}
        </div>
        
        {/* Caption & Actions (for Feed) */}
        {!isReel && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
            <div className="text-white text-xs leading-snug">
              <span className="font-bold">{account.username}</span>{' '}
              <p className="inline whitespace-pre-wrap break-words">{caption || 'キャプションはここに表示されます...'}</p>
            </div>
          </div>
        )}

        {/* Sidebar Actions (for Reel) */}
        {isReel && (
            <div className="absolute bottom-4 right-2 flex flex-col items-center space-y-4 z-10">
                <div className="flex flex-col items-center text-white">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path></svg>
                    <span className="text-xs font-semibold">1.2k</span>
                </div>
                <div className="flex flex-col items-center text-white">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>
                    <span className="text-xs font-semibold">345</span>
                </div>
                 <div className="flex flex-col items-center text-white">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path></svg>
                    <span className="text-xs font-semibold">シェア</span>
                </div>
                <img src={account.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border-2 border-white animate-spin-slow"/>
            </div>
        )}
      </div>
    </div>
  );
};

export default PostPreview;
