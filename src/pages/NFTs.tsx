
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
    <div className="space-y-6">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">NFT Gallery</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {nfts.map((nft) => (
                <div key={nft.id} className="bg-alphabag-dark border border-alphabag-gray rounded-xl overflow-hidden group">
                    <div className="aspect-square relative overflow-hidden">
                        <img 
                            src={nft.imageUrl} 
                            alt={nft.name} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                    </div>
                    <div className="p-4">
                        <div className="text-alphabag-subtext text-xs uppercase tracking-wide mb-1">{nft.collection}</div>
                        <h3 className="text-white font-bold">{nft.name}</h3>
                        <div className="mt-4 flex justify-between items-end">
                            <span className="text-xs text-alphabag-subtext">Floor Price</span>
                            <span className="text-alphabag-yellow font-mono text-sm">{nft.floorPrice} ETH</span>
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Empty State Placeholder */}
            {nfts.length === 0 && (
                <div className="col-span-full py-20 text-center text-alphabag-subtext">
                    <Image size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No NFTs found in connected wallet.</p>
                </div>
            )}
        </div>
    </div>
  );
};
