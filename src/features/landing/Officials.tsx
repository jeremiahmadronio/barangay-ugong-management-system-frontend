import React, { useState, useEffect } from 'react';
import { User, Loader2 } from 'lucide-react';
import { officialApi } from "@/cms-api/officialApi";
import type { Official } from "@/cms-api/officialApi";

const OfficialCard = ({ name, position, isCaptain = false, photoUrl }: { name: string, position: string, isCaptain?: boolean, photoUrl?: string }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 flex flex-col items-center hover:shadow-xl hover:border-blue-200 transition-all duration-300 w-full h-full ${isCaptain ? 'max-w-[340px]' : 'max-w-[280px]'}`}>
    <div className={`${isCaptain ? 'w-28 h-28 sm:w-32 sm:h-32' : 'w-20 h-20 sm:w-24 sm:h-24'} rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden mb-4 sm:mb-5 transition-transform duration-300 hover:scale-105 shrink-0`}>
      {photoUrl ? (
        <img src={photoUrl.startsWith('http') ? photoUrl : `${(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "")}${photoUrl}`} alt={name} className="w-full h-full object-cover" />
      ) : (
        <User className={`${isCaptain ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-12 sm:h-12'} text-slate-400`} />
      )}
    </div>
    <h3 className={`font-bold text-slate-900 text-center mb-1 leading-tight ${isCaptain ? 'text-base sm:text-lg' : 'text-sm sm:text-sm'}`}>{name}</h3>
    <p className="text-[11px] sm:text-xs text-slate-500 text-center font-medium leading-relaxed">{position}</p>
  </div>
);

export const Officials = () => {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        const data = await officialApi.getPublicOfficials();
        setOfficials(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch officials:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOfficials();
  }, []);

  const captains = officials.filter(o => o.type === 'CAPTAIN');
  const kagawads = officials.filter(o => o.type === 'KAGAWAD');
  const othersAndStaff = officials.filter(o => o.type !== 'CAPTAIN' && o.type !== 'KAGAWAD');
  
  // To keep the layout symmetrical, we chunk kagawads into rows of 4.
  const kagawadRows = [];
  for (let i = 0; i < kagawads.length; i += 4) {
    kagawadRows.push(kagawads.slice(i, i + 4));
  }

  // Normalize group names to uppercase to avoid case-sensitive duplicate sections
  const normalizedOthers = othersAndStaff.map(o => ({ ...o, normalizedType: o.type.toUpperCase() }));
  const customGroups = Array.from(new Set(normalizedOthers.map(o => o.normalizedType)));

  return (
    <section id="officials" className="pb-32 bg-slate-50 relative overflow-hidden pt-12 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
             <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: 'var(--theme-primary)' }} />
             <p className="text-sm font-semibold text-slate-500">Loading Barangay Officials...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            
            {/* Tier 1: Punong Barangay */}
            {captains.length > 0 && (
              <div className="flex flex-col items-center relative w-full">
                <h2 className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase mb-4 sm:mb-6" style={{ color: 'var(--theme-primary)' }}>Punong Barangay</h2>
                <OfficialCard name={captains[0].name} position={captains[0].position} isCaptain={true} photoUrl={captains[0].imageUrl} />
                {/* Line down to horizontal split */}
                <div className="w-px h-8 sm:h-12 bg-slate-300"></div>
              </div>
            )}

            {/* Tier 2: Kagawads */}
            {kagawads.length > 0 && (
              <div className="w-full relative flex flex-col items-center">
                <div className="w-full max-w-[1100px] flex flex-col items-center relative">
                  {/* Center Line going all the way down */}
                  <div className="absolute top-0 left-1/2 w-px h-[calc(100%+3rem)] sm:h-[calc(100%+4.5rem)] bg-slate-300 -translate-x-1/2 -z-20 hidden sm:block"></div>
                  
                  <h2 className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase mb-6 sm:mb-8 bg-slate-50 px-4 relative z-10 hidden sm:block" style={{ color: 'var(--theme-primary)' }}>
                    Sangguniang Barangay — Kagawad
                  </h2>
                  <h2 className="text-[10px] sm:hidden font-bold tracking-[0.15em] uppercase mb-4 text-center mt-4" style={{ color: 'var(--theme-primary)' }}>
                    Sangguniang Barangay — Kagawad
                  </h2>
                  
                  {kagawadRows.map((row, rowIdx) => (
                    <React.Fragment key={rowIdx}>
                      {rowIdx > 0 && <div className="h-10 w-full hidden sm:block"></div>}
                      <div className={`w-full relative ${rowIdx > 0 ? 'mt-8 sm:mt-0' : ''}`}>
                        {/* Horizontal line for Row */}
                        <div className="absolute top-0 left-[12.5%] right-[12.5%] h-px bg-slate-300 -z-10 hidden sm:block"></div>
                        <div className="grid grid-cols-1 sm:flex justify-center w-full gap-4 sm:gap-4 relative z-10">
                          {row.map((k, idx) => (
                            <div key={idx} className="flex flex-col items-center flex-1">
                              <div className="w-px h-8 bg-slate-300 mb-0 hidden sm:block"></div>
                              <OfficialCard name={k.name} position={k.position} photoUrl={k.imageUrl} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}

                </div>
              </div>
            )}

            {/* Tier 3+: Dynamic Custom Groups (Staff, SK, etc) */}
            {customGroups.map((groupType, groupIdx) => {
              const groupOfficials = normalizedOthers.filter(o => o.normalizedType === groupType);
              const groupTitle =
                groupType === 'STAFF'
                  ? 'Barangay Appointees & Staff'
                  : groupType === 'SK'
                  ? 'Sangguniang Kabataan (SK)'
                  : groupType;

              return (
                <div key={groupType} className={`w-full relative flex flex-col items-center mt-8 sm:mt-16`}>
                  <div className="w-full max-w-[900px] flex flex-col items-center relative">
                    {/* Horizontal Line for members */}
                    <div className="absolute top-0 left-[15%] right-[15%] h-px bg-slate-300 -z-10 hidden sm:block"></div>
                    
                    <h2 className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase mb-6 sm:mb-8 bg-slate-50 px-4 relative z-10 hidden sm:block" style={{ color: 'var(--theme-primary)' }}>
                      {groupTitle}
                    </h2>
                    <h2 className="text-[10px] sm:hidden font-bold tracking-[0.15em] uppercase mb-4 text-center mt-6" style={{ color: 'var(--theme-primary)' }}>
                      {groupTitle}
                    </h2>

                    <div className="grid grid-cols-1 sm:flex justify-center w-full gap-4 sm:gap-4 relative z-10 flex-wrap">
                      {groupOfficials.map((s, idx) => (
                        <div key={idx} className="flex flex-col items-center flex-1 min-w-[200px] max-w-[280px]">
                          <div className="w-px h-8 bg-slate-300 mb-0 hidden sm:block"></div>
                          <OfficialCard name={s.name} position={s.position} photoUrl={s.imageUrl} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="mt-16 sm:mt-20 text-center max-w-2xl mx-auto px-4">
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                Officials hold office at the Barangay Hall during regular hours. Concerns that require a council session may be raised during the Barangay Assembly held every quarter.
              </p>
            </div>

          </div>
        )}
      </div>
    </section>
  );
};

export default Officials;
