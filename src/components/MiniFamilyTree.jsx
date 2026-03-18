import { Link } from 'react-router-dom';
import { useRef, useEffect, useState, useCallback } from 'react';
import { calculateAge } from '../data/vedic';

function PersonNode({ person, isCurrent, nodeRef }) {
  const age = calculateAge(
    person.dob,
    person.isDeceased && person.dateOfDeath ? new Date(person.dateOfDeath) : undefined
  );
  const ageDisplay = person.isDeceased ? '✦' : age !== null ? age : '';

  const initials = person.firstName?.[0]?.toUpperCase() || '?';
  const genderIcon = person.gender === 'Male' ? '♂' : person.gender === 'Female' ? '♀' : '';

  const avatarColors = person.isDeceased
    ? 'bg-stone-100 text-stone-500 border-stone-300'
    : person.gender === 'Male'
      ? 'bg-sky-50 text-sky-600 border-sky-200'
      : 'bg-rose-50 text-rose-500 border-rose-200';

  const card = (
    <div
      ref={nodeRef}
      className={`group relative flex flex-col items-center rounded-xl px-3 py-2.5 min-w-[100px] max-w-[120px] transition-all duration-200
        ${isCurrent
          ? 'bg-gradient-to-b from-saffron-50 to-orange-50 border-2 border-saffron-400 shadow-md shadow-saffron-200/40 scale-105'
          : 'bg-white border border-stone-200 shadow-sm hover:shadow-md hover:border-stone-300 hover:-translate-y-0.5'
        }
        ${person.isDeceased ? 'opacity-75' : ''}`}
    >
      {/* Avatar circle */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${avatarColors}`}>
        {initials}
      </div>

      {/* Name */}
      <p className="mt-1.5 text-xs font-semibold text-stone-800 text-center leading-tight truncate w-full">
        {person.firstName}
      </p>
      {person.lastName && (
        <p className="text-[10px] text-stone-400 truncate w-full text-center leading-tight">
          {person.lastName}
        </p>
      )}

      {/* Age / Deceased badge */}
      {ageDisplay !== '' && (
        <span className={`mt-0.5 text-[10px] font-medium ${person.isDeceased ? 'text-stone-400' : 'text-stone-500'}`}>
          {person.isDeceased ? '✦ Deceased' : `${ageDisplay}y`}
        </span>
      )}

      {/* Gender indicator dot */}
      {genderIcon && (
        <span className={`absolute -top-1 -right-1 text-[10px] w-4 h-4 rounded-full flex items-center justify-center
          ${person.gender === 'Male' ? 'bg-sky-100 text-sky-500' : 'bg-rose-100 text-rose-400'}`}>
          {genderIcon}
        </span>
      )}

      {/* Current member indicator */}
      {isCurrent && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-saffron-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
          You
        </div>
      )}
    </div>
  );

  if (isCurrent) return card;

  return (
    <Link to={`/members/${person.id}`} className="no-underline">
      {card}
    </Link>
  );
}

function MarriageBond() {
  return (
    <div className="flex items-center gap-0 self-center">
      <div className="w-3 h-px bg-rose-300" />
      <span className="text-rose-400 text-xs select-none">♥</span>
      <div className="w-3 h-px bg-rose-300" />
    </div>
  );
}

export default function MiniFamilyTree({ member, members }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const parentRowRef = useRef(null);
  const memberRowRef = useRef(null);
  const childRowRef = useRef(null);
  const [, forceUpdate] = useState(0);

  const father = member.fatherId ? members.find(m => m.id === member.fatherId) : null;
  const mother = member.motherId ? members.find(m => m.id === member.motherId) : null;
  const spouse = member.spouseId ? members.find(m => m.id === member.spouseId) : null;
  const children = (member.childrenIds || []).map(id => members.find(m => m.id === id)).filter(Boolean);
  const siblings = members.filter(
    m =>
      m.id !== member.id &&
      ((member.fatherId && m.fatherId === member.fatherId) ||
        (member.motherId && m.motherId === member.motherId))
  );

  const hasParents = father || mother;
  const hasChildren = children.length > 0;
  const hasSiblings = siblings.length > 0;

  const leftSiblings = siblings.slice(0, Math.floor(siblings.length / 2));
  const rightSiblings = siblings.slice(Math.floor(siblings.length / 2));

  // Draw SVG connector lines after layout
  const drawConnections = useCallback(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const rect = container.getBoundingClientRect();
    svg.setAttribute('width', rect.width);
    svg.setAttribute('height', rect.height);
    svg.innerHTML = '';

    const line = (x1, y1, x2, y2, color = '#d6d3d1', width = 1.5) => {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', x1); l.setAttribute('y1', y1);
      l.setAttribute('x2', x2); l.setAttribute('y2', y2);
      l.setAttribute('stroke', color); l.setAttribute('stroke-width', width);
      l.setAttribute('stroke-linecap', 'round');
      svg.appendChild(l);
    };

    const cx = (el) => {
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2 - rect.left;
    };
    const bottom = (el) => el.getBoundingClientRect().bottom - rect.top;
    const top = (el) => el.getBoundingClientRect().top - rect.top;

    // Parents → mid-point → down to member row
    const parentRow = parentRowRef.current;
    const memberRow = memberRowRef.current;

    if (hasParents && parentRow && memberRow) {
      const parentCards = parentRow.querySelectorAll('[data-node]');
      const memberCards = memberRow.querySelectorAll('[data-node]');

      // Find the parent row's center bottom
      const parentBottom = bottom(parentRow);
      const memberTop = top(memberRow);
      const midY = (parentBottom + memberTop) / 2;

      // Line from parent center to midpoint, then to each sibling/member
      if (parentCards.length > 0) {
        // Find center X between parents
        const parentXs = Array.from(parentCards).map(cx);
        const parentCenterX = parentXs.reduce((a, b) => a + b, 0) / parentXs.length;

        // Vertical from parents center to midY
        line(parentCenterX, parentBottom, parentCenterX, midY);

        // Collect all member row nodes
        const memberXs = Array.from(memberCards).map(cx);
        if (memberXs.length > 0) {
          const minX = Math.min(...memberXs);
          const maxX = Math.max(...memberXs);

          // Horizontal bar at midY
          if (memberXs.length > 1 || parentCenterX !== memberXs[0]) {
            const hMin = Math.min(minX, parentCenterX);
            const hMax = Math.max(maxX, parentCenterX);
            line(hMin, midY, hMax, midY);
          }

          // Vertical drops to each member card
          memberXs.forEach(mx => {
            line(mx, midY, mx, top(memberCards[0]));
          });
        }
      }
    }

    // Member row → children
    if (hasChildren && memberRow) {
      const childRow = childRowRef.current;
      if (!childRow) return;

      // Find the current member + spouse group center
      const coupleGroup = memberRow.querySelector('[data-couple]');
      const coupleCx = coupleGroup ? cx(coupleGroup) : cx(memberRow);
      const coupleBottom = coupleGroup ? bottom(coupleGroup) : bottom(memberRow);
      const childTop = top(childRow);
      const midY = (coupleBottom + childTop) / 2;

      // Vertical from couple to midY
      line(coupleCx, coupleBottom, coupleCx, midY);

      // Child cards
      const childCards = childRow.querySelectorAll('[data-node]');
      const childXs = Array.from(childCards).map(cx);

      if (childXs.length > 0) {
        const minX = Math.min(...childXs, coupleCx);
        const maxX = Math.max(...childXs, coupleCx);

        // Horizontal bar
        line(minX, midY, maxX, midY);

        // Vertical drops
        childXs.forEach(childCenterX => {
          line(childCenterX, midY, childCenterX, childTop + 2);
        });
      }
    }
  }, [hasParents, hasChildren, member.id]);

  useEffect(() => {
    // Small delay to allow layout to settle
    const timer = setTimeout(() => {
      drawConnections();
      forceUpdate(n => n + 1);
    }, 50);

    window.addEventListener('resize', drawConnections);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', drawConnections);
    };
  }, [drawConnections, members]);

  if (!hasParents && !spouse && !hasChildren && !hasSiblings) {
    return (
      <div className="text-center py-6 text-stone-400 text-sm">
        No immediate family connections found.
      </div>
    );
  }

  return (
    <div className="relative py-4 overflow-x-auto" ref={containerRef}>
      {/* SVG layer for connection lines */}
      <svg ref={svgRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />

      <div className="relative flex flex-col items-center gap-6" style={{ zIndex: 1 }}>
        {/* PARENTS ROW */}
        {hasParents && (
          <div ref={parentRowRef} className="flex items-center gap-1 justify-center">
            {father && <div data-node><PersonNode person={father} /></div>}
            {father && mother && <MarriageBond />}
            {mother && <div data-node><PersonNode person={mother} /></div>}
            {!father && mother && <div data-node><PersonNode person={mother} /></div>}
          </div>
        )}

        {/* Label */}
        {hasParents && (hasSiblings || true) && (
          <div className="flex items-center gap-2 -my-3">
            <div className="h-px w-8 bg-stone-200" />
            <span className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">
              {hasSiblings ? 'Siblings' : ''}
            </span>
            <div className="h-px w-8 bg-stone-200" />
          </div>
        )}

        {/* SIBLINGS + MEMBER + SPOUSE ROW */}
        <div ref={memberRowRef} className="flex items-end gap-3 justify-center flex-wrap">
          {leftSiblings.map(s => (
            <div key={s.id} data-node className="flex flex-col items-center">
              <PersonNode person={s} />
            </div>
          ))}

          {/* Current member + spouse as a couple group */}
          <div data-node data-couple className="flex items-end gap-1">
            <PersonNode person={member} isCurrent />
            {spouse && (
              <>
                <MarriageBond />
                <PersonNode person={spouse} />
              </>
            )}
          </div>

          {rightSiblings.map(s => (
            <div key={s.id} data-node className="flex flex-col items-center">
              <PersonNode person={s} />
            </div>
          ))}
        </div>

        {/* Children label */}
        {hasChildren && (
          <div className="flex items-center gap-2 -my-3">
            <div className="h-px w-8 bg-stone-200" />
            <span className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">Children</span>
            <div className="h-px w-8 bg-stone-200" />
          </div>
        )}

        {/* CHILDREN ROW */}
        {hasChildren && (
          <div ref={childRowRef} className="flex items-start gap-3 justify-center flex-wrap">
            {children.map(child => (
              <div key={child.id} data-node className="flex flex-col items-center">
                <PersonNode person={child} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
