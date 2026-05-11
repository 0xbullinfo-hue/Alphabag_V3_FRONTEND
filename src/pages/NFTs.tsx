
import React, { useEffect, useState } from 'react';
import { fetchNFTs } from '../services/mockData';
import { NFTItem } from '../types';
import { Image } from 'lucide-react';

export const NFTs: React.FC = () => {
  const [nfts, setNfts] = useState<NFTItem[]>([]);

  useEffect(() => {
    fetchNFTs().then(setNfts);
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none">NFT <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-1">Gallery</span></h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {nfts.map((nft) => (
                <div key={nft.id} className="bg-alphabag-dark border border-alphabag-gray rounded-xl overflow-hidden group hover:border-alphabag-yellow/30 transition-all shadow-lg">
                    <div className="aspect-square relative overflow-hidden bg-black/20">
                        <img 
                            src={nft.imageUrl} 
                            alt={nft.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                    </div>
                    <div className="p-3">
                        <div className="text-alphabag-subtext text-[9px] uppercase font-black tracking-[0.2em] mb-1 opacity-60 truncate">{nft.collection}</div>
                        <h3 className="text-white font-bold text-[13px] truncate leading-tight group-hover:text-alphabag-yellow transition-colors">{nft.name}</h3>
                        <div className="mt-2.5 pt-2.5 border-t border-white/5 flex justify-between items-center">
                            <span className="text-[9px] text-alphabag-subtext uppercase font-bold tracking-widest">Floor</span>
                            <span className="text-alphabag-yellow font-black tabular-nums text-[11px]">{nft.floorPrice} <span className="text-[9px]">ETH</span></span>
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Empty State Placeholder */}
            {nfts.length === 0 && (
                <div className="col-span-full py-20 text-center text-alphabag-subtext">
                    <Image size={32} className="mx-auto mb-3 opacity-20" />
                    <p className="text-[11px] font-bold uppercase tracking-widest opacity-40">No NFT transmissions detected in wallet.</p>
                </div>
            )}
        </div>
    </div>
  );
};
