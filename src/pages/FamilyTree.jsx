import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { calculateAge } from '../data/vedic';
import * as d3 from 'd3';

// Color palettes
const COLORS = {
  male: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', light: '#eff6ff' },
  female: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d', light: '#fdf2f8' },
  deceased: { bg: '#f5f5f4', border: '#a8a29e', text: '#78716c', light: '#fafaf9' },
  highlight: { bg: '#fff7ed', border: '#f97316', glow: 'rgba(249,115,22,0.3)' },
  link: { normal: '#d6d3d1', gradient1: '#e7e5e4', gradient2: '#a8a29e' },
  spouse: { line: '#f9a8d4', heart: '#ec4899' },
};

const GENERATION_COLORS = [
  '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706',
];

// Particle system for animated connections
const PARTICLE_CONFIG = {
  count: 3,         // particles per link
  speed: 0.004,     // movement speed (0 to 1 per frame)
  size: 2.5,        // particle radius
  color: '#f59e0b', // saffron gold
  glow: 'rgba(245, 158, 11, 0.4)',
  trailLength: 0.08,
};

export default function FamilyTree() {
  const { members } = useFamily();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const particlesRef = useRef(null);   // animation frame ref
  const collapsedRef = useRef(new Set()); // collapsed node IDs
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [highlightId, setHighlightId] = useState(null);
  const [viewMode, setViewMode] = useState('banyan');
  const [showSpouses, setShowSpouses] = useState(true);
  const [tooltip, setTooltip] = useState(null);
  const [, forceUpdate] = useState(0); // trigger redraws on collapse toggle

  // Build hierarchy data with collapse support
  const buildTreeData = useCallback(() => {
    const roots = members.filter(m => !m.fatherId && !m.motherId);
    if (roots.length === 0) return null;

    function countDesc(id, visited = new Set()) {
      if (visited.has(id)) return 0;
      visited.add(id);
      const children = members.filter(x => x.fatherId === id || x.motherId === id);
      return 1 + children.reduce((s, c) => s + countDesc(c.id, visited), 0);
    }

    // Sort roots by descendant count (largest family first)
    const sortedRoots = [...roots].sort((a, b) => countDesc(b.id) - countDesc(a.id));

    // Also find members who are parents but not reachable from any root via father/mother links
    // (e.g., mothers who married into the family — they have children but aren't roots themselves
    //  and aren't children of any root)

    function buildNode(member, depth = 0, visited = new Set()) {
      if (visited.has(member.id)) return null;
      visited.add(member.id);

      const childMembers = members.filter(m => m.fatherId === member.id || m.motherId === member.id);
      const seen = new Set();
      const uniqueChildren = childMembers.filter(c => {
        if (seen.has(c.id) || visited.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

      const isCollapsed = collapsedRef.current.has(member.id);
      const totalDescendants = countDesc(member.id) - 1;
      const spouse = member.spouseId ? members.find(m => m.id === member.spouseId) : null;
      const age = calculateAge(member.dob, member.isDeceased && member.dateOfDeath ? new Date(member.dateOfDeath) : undefined);

      return {
        id: member.id,
        name: member.firstName,
        surname: member.lastName || '',
        fullName: `${member.firstName} ${member.lastName || ''}`.trim(),
        gender: member.gender,
        isDeceased: member.isDeceased || false,
        dob: member.dob,
        pob: member.pob || '',
        age,
        gotram: member.gotram || '',
        nakshatram: member.nakshatram || '',
        spouseName: spouse ? spouse.firstName : null,
        spouseSurname: spouse?.lastName || '',
        spouseId: spouse?.id,
        spouseGender: spouse?.gender,
        spouseDeceased: spouse?.isDeceased || false,
        depth,
        isCollapsed,
        totalDescendants,
        hasChildren: uniqueChildren.length > 0,
        children: isCollapsed ? [] : uniqueChildren.map(c => buildNode(c, depth + 1, visited)).filter(Boolean),
      };
    }

    // Build trees from all roots using shared visited set so no member appears twice
    const visited = new Set();
    const allTrees = sortedRoots.map(r => buildNode(r, 0, visited)).filter(Boolean);

    // If only one tree, return it directly (no virtual root needed)
    if (allTrees.length === 1) return allTrees[0];

    // Multiple trees → create a virtual root that holds them all
    return {
      id: '__virtual_root__',
      name: 'Family',
      surname: '',
      fullName: 'Family',
      gender: 'unknown',
      isDeceased: false,
      dob: null,
      pob: '',
      age: null,
      gotram: '',
      nakshatram: '',
      spouseName: null,
      spouseSurname: '',
      spouseId: null,
      spouseGender: null,
      spouseDeceased: false,
      depth: 0,
      isCollapsed: false,
      totalDescendants: members.length,
      hasChildren: true,
      isVirtualRoot: true,
      children: allTrees,
    };
  }, [members]);

  // Toggle collapse for a node
  const toggleCollapse = useCallback((nodeId) => {
    if (collapsedRef.current.has(nodeId)) {
      collapsedRef.current.delete(nodeId);
    } else {
      collapsedRef.current.add(nodeId);
    }
    forceUpdate(n => n + 1);
  }, []);

  // ========================
  // PARTICLE ANIMATION SYSTEM
  // ========================
  const startParticleAnimation = useCallback((svg, linkPaths) => {
    // Cancel any existing animation
    if (particlesRef.current) {
      cancelAnimationFrame(particlesRef.current);
    }

    const svgEl = svg.node();
    if (!svgEl || linkPaths.length === 0) return;

    // Create particle container
    const particleGroup = svg.append('g').attr('class', 'particles').style('pointer-events', 'none');

    // Initialize particles for each link
    const particles = [];
    linkPaths.forEach((pathEl) => {
      const totalLength = pathEl.getTotalLength();
      if (totalLength < 10) return;
      for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
        particles.push({
          path: pathEl,
          totalLength,
          offset: i / PARTICLE_CONFIG.count,  // stagger
          progress: Math.random(),              // current position 0-1
        });
      }
    });

    // Create particle circles
    const circles = particleGroup.selectAll('circle')
      .data(particles)
      .join('circle')
      .attr('r', PARTICLE_CONFIG.size)
      .attr('fill', PARTICLE_CONFIG.color)
      .attr('opacity', 0.8)
      .style('filter', `drop-shadow(0 0 3px ${PARTICLE_CONFIG.glow})`);

    // Trail circles (smaller, fading)
    const trails = particleGroup.selectAll('.trail')
      .data(particles)
      .join('circle')
      .attr('class', 'trail')
      .attr('r', PARTICLE_CONFIG.size * 0.6)
      .attr('fill', PARTICLE_CONFIG.color)
      .attr('opacity', 0.3);

    function animate() {
      particles.forEach((p, i) => {
        p.progress += PARTICLE_CONFIG.speed;
        if (p.progress > 1) p.progress -= 1;

        try {
          const point = p.path.getPointAtLength(p.progress * p.totalLength);
          circles.filter((_, j) => j === i)
            .attr('cx', point.x)
            .attr('cy', point.y);

          // Trail behind
          const trailProgress = Math.max(0, p.progress - PARTICLE_CONFIG.trailLength);
          const trailPoint = p.path.getPointAtLength(trailProgress * p.totalLength);
          trails.filter((_, j) => j === i)
            .attr('cx', trailPoint.x)
            .attr('cy', trailPoint.y);
        } catch {
          // path may be gone after redraw
        }
      });

      particlesRef.current = requestAnimationFrame(animate);
    }

    particlesRef.current = requestAnimationFrame(animate);
  }, []);

  // ========================
  // BANYAN TREE VIEW (Enhanced with particles + collapse)
  // ========================
  const drawBanyanTree = useCallback((svg, g, _width, _height, _treeData, hierarchy) => {
    const allNodes = hierarchy.descendants();
    const allLinks = hierarchy.links();
    // Filter out the virtual root node and its direct links
    const hasVirtualRoot = hierarchy.data.isVirtualRoot;
    const nodes = hasVirtualRoot ? allNodes.filter(d => !d.data.isVirtualRoot) : allNodes;
    const links = hasVirtualRoot ? allLinks.filter(d => !d.source.data.isVirtualRoot) : allLinks;

    // --- DEFS ---
    const defs = svg.append('defs');

    const glow = defs.append('filter').attr('id', 'glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const shadow = defs.append('filter').attr('id', 'card-shadow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    shadow.append('feDropShadow').attr('dx', '0').attr('dy', '2').attr('stdDeviation', '4').attr('flood-color', 'rgba(0,0,0,0.08)');

    // Particle glow filter
    const particleGlow = defs.append('filter').attr('id', 'particle-glow');
    particleGlow.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'blur');
    const pMerge = particleGlow.append('feMerge');
    pMerge.append('feMergeNode').attr('in', 'blur');
    pMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const linkGrad = defs.append('linearGradient').attr('id', 'link-gradient').attr('gradientUnits', 'userSpaceOnUse');
    linkGrad.append('stop').attr('offset', '0%').attr('stop-color', '#d6d3d1');
    linkGrad.append('stop').attr('offset', '100%').attr('stop-color', '#a8a29e');

    // Spouse marker
    defs.append('marker')
      .attr('id', 'heart-marker')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 5).attr('refY', 5)
      .attr('markerWidth', 8).attr('markerHeight', 8)
      .append('text')
      .attr('x', 2).attr('y', 9)
      .attr('font-size', '10px')
      .text('♥');

    // Subtle background grid
    const patternSize = 30;
    const pattern = defs.append('pattern')
      .attr('id', 'grid')
      .attr('width', patternSize).attr('height', patternSize)
      .attr('patternUnits', 'userSpaceOnUse');
    pattern.append('circle').attr('cx', patternSize / 2).attr('cy', patternSize / 2).attr('r', 0.5).attr('fill', '#e7e5e4');

    g.append('rect')
      .attr('x', -5000).attr('y', -5000).attr('width', 10000).attr('height', 10000)
      .attr('fill', 'url(#grid)').attr('opacity', 0.5);

    // --- GENERATION BANDS ---
    const depthOffset = hasVirtualRoot ? 1 : 0;
    const maxDepth = d3.max(nodes, d => d.depth) || 0;
    for (let i = (hasVirtualRoot ? 1 : 0); i <= maxDepth; i++) {
      const nodesAtDepth = nodes.filter(n => n.depth === i);
      if (nodesAtDepth.length === 0) continue;
      const minY = d3.min(nodesAtDepth, n => n.y) - 50;
      const genIndex = i - depthOffset;
      const bandColor = GENERATION_COLORS[genIndex % GENERATION_COLORS.length];

      g.append('rect')
        .attr('x', -5000).attr('y', minY)
        .attr('width', 10000).attr('height', 100)
        .attr('fill', bandColor).attr('opacity', 0.08);

      g.append('text')
        .attr('x', d3.min(nodesAtDepth, n => n.x) - 120)
        .attr('y', minY + 55)
        .attr('fill', '#a8a29e')
        .attr('font-size', '10px')
        .attr('font-family', 'Inter, sans-serif')
        .attr('font-weight', '500')
        .attr('text-anchor', 'end')
        .text(`Gen ${genIndex + 1}`);
    }

    // --- LINKS (Curved with particles) ---
    const linkPathElements = [];
    g.selectAll('.tree-link')
      .data(links)
      .join('path')
      .attr('class', 'tree-link')
      .attr('d', d => {
        const sx = d.source.x;
        const sy = d.source.y + 35;
        const tx = d.target.x;
        const ty = d.target.y - 30;
        const midY = sy + (ty - sy) * 0.4;
        return `M${sx},${sy} C${sx},${midY} ${tx},${midY + (ty - sy) * 0.2} ${tx},${ty}`;
      })
      .attr('fill', 'none')
      .attr('stroke', 'url(#link-gradient)')
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0)
      .transition()
      .duration(800)
      .delay((_, i) => i * 30)
      .attr('opacity', 0.6)
      .each(function () { linkPathElements.push(this); });

    // Start particle animation after links are rendered
    setTimeout(() => {
      startParticleAnimation(svg, linkPathElements);
    }, 1000);

    // --- SPOUSE CONNECTORS ---
    if (showSpouses) {
      const spouseNodes = nodes.filter(n => n.data.spouseId && n.data.spouseName);
      spouseNodes.forEach(node => {
        const spouseX = node.x + 160;
        const spouseY = node.y;
        const colors = node.data.spouseGender === 'Male' ? COLORS.male : COLORS.female;
        const sColors = node.data.spouseDeceased ? COLORS.deceased : colors;

        g.append('line')
          .attr('x1', node.x + 70).attr('y1', node.y)
          .attr('x2', spouseX - 65).attr('y2', spouseY)
          .attr('stroke', COLORS.spouse.line)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '6,3')
          .attr('opacity', 0)
          .transition().duration(600).delay(400)
          .attr('opacity', 0.7);

        g.append('text')
          .attr('x', (node.x + 70 + spouseX - 65) / 2)
          .attr('y', node.y + 5)
          .attr('text-anchor', 'middle')
          .attr('font-size', '14px')
          .attr('fill', COLORS.spouse.heart)
          .text('♥')
          .attr('opacity', 0)
          .transition().duration(600).delay(500)
          .attr('opacity', 0.8);

        const spouseGroup = g.append('g')
          .attr('transform', `translate(${spouseX},${spouseY})`)
          .style('cursor', 'pointer')
          .on('click', () => navigate(`/members/${node.data.spouseId}`))
          .on('mouseenter', function (event) {
            d3.select(this).select('rect').transition().duration(200)
              .attr('stroke-width', 2.5).attr('y', -28);
            setTooltip({
              x: event.pageX, y: event.pageY,
              name: `${node.data.spouseName} ${node.data.spouseSurname}`,
              info: node.data.spouseDeceased ? 'Deceased' : 'Click to view profile',
            });
          })
          .on('mouseleave', function () {
            d3.select(this).select('rect').transition().duration(200)
              .attr('stroke-width', 1.5).attr('y', -25);
            setTooltip(null);
          });

        spouseGroup.append('rect')
          .attr('x', -65).attr('y', -25).attr('width', 130).attr('height', 50)
          .attr('rx', 12).attr('ry', 12)
          .attr('fill', sColors.light)
          .attr('stroke', sColors.border)
          .attr('stroke-width', 1.5)
          .attr('filter', 'url(#card-shadow)')
          .attr('opacity', 0)
          .transition().duration(500).delay(500)
          .attr('opacity', 1);

        spouseGroup.append('text')
          .attr('text-anchor', 'middle').attr('y', -3)
          .attr('fill', sColors.text).attr('font-weight', '600')
          .attr('font-size', '11px').attr('font-family', 'Inter, sans-serif')
          .text(node.data.spouseName)
          .attr('opacity', 0)
          .transition().duration(500).delay(600)
          .attr('opacity', 1);

        spouseGroup.append('text')
          .attr('text-anchor', 'middle').attr('y', 14)
          .attr('fill', '#a8a29e').attr('font-size', '9px').attr('font-family', 'Inter, sans-serif')
          .text(node.data.spouseSurname)
          .attr('opacity', 0)
          .transition().duration(500).delay(650)
          .attr('opacity', 1);

        if (node.data.spouseDeceased) {
          spouseGroup.append('text')
            .attr('x', 50).attr('y', -15)
            .attr('font-size', '10px').attr('fill', '#a8a29e')
            .text('✦');
        }
      });
    }

    // --- MEMBER NODES ---
    const nodeGroup = g.selectAll('.tree-node')
      .data(nodes)
      .join('g')
      .attr('class', 'tree-node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    nodeGroup.each(function (d) {
      const node = d3.select(this);
      const isHighlighted = highlightId && d.data.id === highlightId;
      const colors = d.data.isDeceased ? COLORS.deceased :
        d.data.gender === 'Male' ? COLORS.male : COLORS.female;
      const cardColors = isHighlighted ? COLORS.highlight : colors;

      // Card background
      node.append('rect')
        .attr('class', 'node-card')
        .attr('x', -70).attr('y', -27).attr('width', 140).attr('height', 54)
        .attr('rx', 14).attr('ry', 14)
        .attr('fill', cardColors.bg || cardColors.light)
        .attr('stroke', cardColors.border)
        .attr('stroke-width', isHighlighted ? 3 : 1.5)
        .attr('filter', isHighlighted ? 'url(#glow)' : 'url(#card-shadow)')
        .attr('opacity', 0)
        .transition()
        .duration(500)
        .delay(d.depth * 150 + 100)
        .attr('opacity', 1);

      // Avatar circle
      node.append('circle')
        .attr('class', 'node-avatar')
        .attr('cx', -45).attr('cy', 0).attr('r', 16)
        .attr('fill', colors.border)
        .attr('opacity', 0.2);

      // Avatar letter
      node.append('text')
        .attr('x', -45).attr('y', 5)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.border)
        .attr('font-weight', '700')
        .attr('font-size', '14px')
        .attr('font-family', 'Inter, sans-serif')
        .text(d.data.name?.[0]?.toUpperCase() || '?');

      // Name
      node.append('text')
        .attr('x', -20).attr('y', -5)
        .attr('fill', colors.text || '#292524')
        .attr('font-weight', '600')
        .attr('font-size', '11px')
        .attr('font-family', '"Playfair Display", Georgia, serif')
        .text(d.data.name)
        .attr('opacity', 0)
        .transition().duration(400).delay(d.depth * 150 + 200)
        .attr('opacity', 1);

      // Surname
      node.append('text')
        .attr('x', -20).attr('y', 10)
        .attr('fill', '#a8a29e')
        .attr('font-size', '9px')
        .attr('font-family', 'Inter, sans-serif')
        .text(d.data.surname);

      // Age badge
      if (d.data.age !== null) {
        node.append('text')
          .attr('x', 55).attr('y', 14)
          .attr('text-anchor', 'middle')
          .attr('fill', '#a8a29e')
          .attr('font-size', '8px')
          .attr('font-family', 'Inter, sans-serif')
          .text(d.data.isDeceased ? `†${d.data.age}y` : `${d.data.age}y`);
      }

      // Deceased marker
      if (d.data.isDeceased) {
        node.append('text')
          .attr('x', 58).attr('y', -14)
          .attr('font-size', '10px').attr('fill', '#a8a29e')
          .text('✦');
      }

      // ---- COLLAPSE/EXPAND BUTTON ----
      if (d.data.hasChildren) {
        const btnG = node.append('g')
          .attr('class', 'collapse-btn')
          .attr('transform', 'translate(0, 32)')
          .style('cursor', 'pointer')
          .on('click', (event) => {
            event.stopPropagation();
            toggleCollapse(d.data.id);
          });

        btnG.append('circle')
          .attr('r', 10)
          .attr('fill', d.data.isCollapsed ? '#f59e0b' : 'white')
          .attr('stroke', d.data.isCollapsed ? '#d97706' : '#d6d3d1')
          .attr('stroke-width', 1.5);

        btnG.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('font-size', '12px')
          .attr('font-weight', '700')
          .attr('fill', d.data.isCollapsed ? 'white' : '#78716c')
          .attr('font-family', 'Inter, sans-serif')
          .text(d.data.isCollapsed ? '+' : '−');

        // Descendant count badge when collapsed
        if (d.data.isCollapsed && d.data.totalDescendants > 0) {
          btnG.append('rect')
            .attr('x', 8).attr('y', -8)
            .attr('width', 24).attr('height', 16)
            .attr('rx', 8)
            .attr('fill', '#f59e0b');

          btnG.append('text')
            .attr('x', 20).attr('y', -0.5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '8px')
            .attr('font-weight', '700')
            .attr('fill', 'white')
            .attr('font-family', 'Inter, sans-serif')
            .text(d.data.totalDescendants);
        }
      }
    });

    // Click to navigate, hover for tooltip (on the card area, not collapse btn)
    nodeGroup
      .on('click', (event, d) => {
        // Don't navigate if clicking collapse button
        if (event.target.closest('.collapse-btn')) return;
        navigate(`/members/${d.data.id}`);
      })
      .on('mouseenter', function (event, d) {
        d3.select(this).select('.node-card').transition().duration(200)
          .attr('stroke-width', 2.5).attr('y', -30);
        d3.select(this).select('.node-avatar').transition().duration(200)
          .attr('r', 18);
        setTooltip({
          x: event.pageX, y: event.pageY,
          name: d.data.fullName,
          info: [
            d.data.age !== null ? `${d.data.isDeceased ? 'Lived' : 'Age'}: ${d.data.age}` : null,
            d.data.gotram ? `Gotram: ${d.data.gotram}` : null,
            d.data.nakshatram ? `Naksh: ${d.data.nakshatram}` : null,
            d.data.pob ? `Born: ${d.data.pob}` : null,
            d.data.totalDescendants > 0 ? `${d.data.totalDescendants} descendants` : null,
          ].filter(Boolean).join(' | '),
        });
      })
      .on('mouseleave', function () {
        d3.select(this).select('.node-card').transition().duration(200)
          .attr('stroke-width', 1.5).attr('y', -27);
        d3.select(this).select('.node-avatar').transition().duration(200)
          .attr('r', 16);
        setTooltip(null);
      });

  }, [navigate, highlightId, showSpouses, toggleCollapse, startParticleAnimation]);

  // ========================
  // RADIAL TREE VIEW
  // ========================
  const drawRadialTree = useCallback((svg, g, width, height, _treeData, hierarchy) => {
    const defs = svg.append('defs');
    const shadow = defs.append('filter').attr('id', 'card-shadow-r').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    shadow.append('feDropShadow').attr('dx', '0').attr('dy', '1').attr('stdDeviation', '3').attr('flood-color', 'rgba(0,0,0,0.1)');

    const hasVirtualRoot = hierarchy.data.isVirtualRoot;
    const radius = Math.min(width, height) / 2 - 100;
    const treeLayout = d3.tree()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / Math.max(a.depth, 1));

    treeLayout(hierarchy);
    const allNodes = hierarchy.descendants();
    const allLinks = hierarchy.links();
    const nodes = hasVirtualRoot ? allNodes.filter(d => !d.data.isVirtualRoot) : allNodes;
    const links = hasVirtualRoot ? allLinks.filter(d => !d.source.data.isVirtualRoot) : allLinks;

    g.attr('transform', `translate(${width / 2},${height / 2})`);

    const depthOffset = hasVirtualRoot ? 1 : 0;
    const maxDepth = d3.max(nodes, d => d.depth) || 0;
    for (let i = (hasVirtualRoot ? 1 : 0); i <= maxDepth; i++) {
      const genIndex = i - depthOffset;
      const r = (radius / maxDepth) * i;
      g.append('circle')
        .attr('cx', 0).attr('cy', 0).attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', GENERATION_COLORS[genIndex % GENERATION_COLORS.length])
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.3);

      g.append('text')
        .attr('x', 5).attr('y', -r - 5)
        .attr('fill', '#a8a29e').attr('font-size', '9px')
        .attr('font-family', 'Inter, sans-serif')
        .text(`Gen ${genIndex + 1}`);
    }

    // Links with particle animation
    const linkPathElements = [];
    g.selectAll('.radial-link')
      .data(links)
      .join('path')
      .attr('class', 'radial-link')
      .attr('d', d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y)
      )
      .attr('fill', 'none')
      .attr('stroke', '#d6d3d1')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0)
      .transition().duration(800).delay((_, i) => i * 20)
      .attr('opacity', 0.5)
      .each(function () { linkPathElements.push(this); });

    setTimeout(() => {
      startParticleAnimation(svg, linkPathElements);
    }, 1000);

    // Nodes
    const nodeGroup = g.selectAll('.radial-node')
      .data(nodes)
      .join('g')
      .attr('class', 'radial-node')
      .attr('transform', d => {
        const angle = d.x - Math.PI / 2;
        return `translate(${d.y * Math.cos(angle)},${d.y * Math.sin(angle)})`;
      })
      .style('cursor', 'pointer')
      .on('click', (_, d) => navigate(`/members/${d.data.id}`))
      .on('mouseenter', function (event, d) {
        d3.select(this).select('circle').transition().duration(200).attr('r', 22);
        setTooltip({
          x: event.pageX, y: event.pageY,
          name: d.data.fullName,
          info: [
            d.data.age !== null ? `${d.data.isDeceased ? 'Lived' : 'Age'}: ${d.data.age}` : null,
            d.data.gotram ? `Gotram: ${d.data.gotram}` : null,
          ].filter(Boolean).join(' | '),
        });
      })
      .on('mouseleave', function () {
        d3.select(this).select('circle').transition().duration(200).attr('r', d => d.depth === 0 ? 25 : 18);
        setTooltip(null);
      });

    nodeGroup.append('circle')
      .attr('r', d => d.depth === 0 ? 25 : 18)
      .attr('fill', d => {
        if (highlightId && d.data.id === highlightId) return COLORS.highlight.bg;
        if (d.data.isDeceased) return COLORS.deceased.bg;
        return d.data.gender === 'Male' ? COLORS.male.bg : COLORS.female.bg;
      })
      .attr('stroke', d => {
        if (highlightId && d.data.id === highlightId) return COLORS.highlight.border;
        if (d.data.isDeceased) return COLORS.deceased.border;
        return d.data.gender === 'Male' ? COLORS.male.border : COLORS.female.border;
      })
      .attr('stroke-width', d => highlightId && d.data.id === highlightId ? 3 : 1.5)
      .attr('filter', 'url(#card-shadow-r)')
      .attr('opacity', 0)
      .transition().duration(500).delay((_, i) => i * 40)
      .attr('opacity', 1);

    nodeGroup.append('text')
      .attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('font-size', d => d.depth === 0 ? '14px' : '11px')
      .attr('font-weight', '700')
      .attr('font-family', '"Playfair Display", serif')
      .attr('fill', d => {
        if (d.data.isDeceased) return COLORS.deceased.text;
        return d.data.gender === 'Male' ? COLORS.male.text : COLORS.female.text;
      })
      .text(d => d.data.name?.[0]?.toUpperCase() || '?');

    nodeGroup.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.x < Math.PI ? 24 : -24)
      .attr('text-anchor', d => d.x < Math.PI ? 'start' : 'end')
      .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('fill', '#57534e')
      .text(d => d.data.name)
      .attr('opacity', 0)
      .transition().duration(400).delay((_, i) => i * 40 + 200)
      .attr('opacity', 1);

  }, [navigate, highlightId, startParticleAnimation]);

  // ========================
  // TIMELINE VIEW
  // ========================
  const drawTimeline = useCallback((svg, g, width, _height) => {
    const defs = svg.append('defs');
    const shadow = defs.append('filter').attr('id', 'card-shadow-t').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    shadow.append('feDropShadow').attr('dx', '0').attr('dy', '1').attr('stdDeviation', '3').attr('flood-color', 'rgba(0,0,0,0.1)');

    const membersWithDob = members.filter(m => m.dob).sort((a, b) => a.dob.localeCompare(b.dob));
    if (membersWithDob.length === 0) return;

    const minYear = new Date(membersWithDob[0].dob).getFullYear();
    const maxYear = new Date().getFullYear();
    const axisY = 50; // axis at top, members stacked below

    const xScale = d3.scaleLinear()
      .domain([minYear - 2, maxYear + 5])
      .range([80, width - 80]);

    // Timeline axis
    g.append('line')
      .attr('x1', 60).attr('y1', axisY)
      .attr('x2', width - 60).attr('y2', axisY)
      .attr('stroke', '#d6d3d1').attr('stroke-width', 2);

    for (let year = Math.ceil(minYear / 10) * 10; year <= maxYear + 5; year += 10) {
      const x = xScale(year);
      g.append('line')
        .attr('x1', x).attr('y1', axisY - 8)
        .attr('x2', x).attr('y2', axisY + 8)
        .attr('stroke', '#a8a29e').attr('stroke-width', 1);
      g.append('text')
        .attr('x', x).attr('y', axisY - 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#a8a29e').attr('font-size', '10px')
        .attr('font-family', 'Inter, sans-serif')
        .text(year);
    }

    // Assign each member a unique row — each gets its own horizontal lane
    const rowHeight = 24;
    const startY = axisY + 30;

    membersWithDob.forEach((member, i) => {
      const birthYear = new Date(member.dob).getFullYear();
      const x = xScale(birthYear);
      const y = startY + i * rowHeight;
      const colors = member.isDeceased ? COLORS.deceased :
        member.gender === 'Male' ? COLORS.male : COLORS.female;
      const isHl = highlightId && member.id === highlightId;

      // Lifespan bar
      const endYear = member.isDeceased && member.dateOfDeath
        ? new Date(member.dateOfDeath).getFullYear()
        : maxYear;
      const barX2 = xScale(endYear);

      g.append('rect')
        .attr('x', x).attr('y', y - 4)
        .attr('width', Math.max(barX2 - x, 4)).attr('height', 8)
        .attr('rx', 4)
        .attr('fill', colors.border)
        .attr('opacity', member.isDeceased ? 0.25 : 0.15);

      // Connector dot at birth
      g.append('circle')
        .attr('cx', x).attr('cy', y)
        .attr('r', 4)
        .attr('fill', isHl ? COLORS.highlight.border : colors.border)
        .attr('stroke', 'white').attr('stroke-width', 1);

      // Death marker
      if (member.isDeceased && member.dateOfDeath) {
        g.append('text')
          .attr('x', barX2 + 2).attr('y', y + 3)
          .attr('font-size', '8px').attr('fill', '#a8a29e')
          .text('✦');
      }

      // Name label — to the LEFT of the birth dot so it doesn't overlap the bar
      const nameLabel = `${member.firstName} ${member.lastName || ''}`.trim();
      const nodeG = g.append('g')
        .style('cursor', 'pointer')
        .on('click', () => navigate(`/members/${member.id}`))
        .on('mouseenter', function (event) {
          const age = calculateAge(member.dob, member.isDeceased && member.dateOfDeath ? new Date(member.dateOfDeath) : undefined);
          setTooltip({
            x: event.pageX, y: event.pageY,
            name: nameLabel,
            info: `Born: ${member.dob}${age !== null ? ` | ${member.isDeceased ? 'Lived' : 'Age'}: ${age}` : ''}${member.gotram ? ` | Gotram: ${member.gotram}` : ''}`,
          });
        })
        .on('mouseleave', () => setTooltip(null));

      nodeG.append('text')
        .attr('x', x - 8).attr('y', y + 3)
        .attr('text-anchor', 'end')
        .attr('font-size', '9px')
        .attr('font-weight', isHl ? '700' : '500')
        .attr('font-family', 'Inter, sans-serif')
        .attr('fill', isHl ? COLORS.highlight.border : '#57534e')
        .text(nameLabel.length > 18 ? nameLabel.slice(0, 17) + '..' : nameLabel);
    });

    // Subtle alternating row backgrounds
    membersWithDob.forEach((_, i) => {
      if (i % 2 === 0) return;
      const y = startY + i * rowHeight;
      g.insert('rect', ':first-child')
        .attr('x', 0).attr('y', y - rowHeight / 2)
        .attr('width', width).attr('height', rowHeight)
        .attr('fill', '#fafaf9');
    });

  }, [members, navigate, highlightId]);

  // ========================
  // PEDIGREE VIEW (Full descendant tree — clean horizontal layout)
  // ========================
  const drawPedigreeChart = useCallback((svg, g, _width, height) => {
    const defs = svg.append('defs');
    const shadow = defs.append('filter').attr('id', 'card-shadow-p').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    shadow.append('feDropShadow').attr('dx', '0').attr('dy', '2').attr('stdDeviation', '3').attr('flood-color', 'rgba(0,0,0,0.08)');

    // Use same tree data as banyan — full descendant tree
    const treeData = buildTreeData();
    if (!treeData) return;

    const hierarchy = d3.hierarchy(treeData, d => d.children);
    const hasVirtualRoot = treeData.isVirtualRoot;
    const nodeW = 170;
    const nodeH = 80;
    const treeLayout = d3.tree()
      .nodeSize([nodeW, nodeH])
      .separation((a, b) => a.parent === b.parent ? 1 : 1.2);
    treeLayout(hierarchy);

    const allNodes = hierarchy.descendants();
    const allLinks = hierarchy.links();
    const nodes = hasVirtualRoot ? allNodes.filter(d => !d.data.isVirtualRoot) : allNodes;
    const links = hasVirtualRoot ? allLinks.filter(d => !d.source.data.isVirtualRoot) : allLinks;

    // Center the tree
    const minX = d3.min(nodes, d => d.x) || 0;
    const maxX = d3.max(nodes, d => d.x) || 0;
    const treeW = maxX - minX + nodeW;
    const treeH = (d3.max(nodes, d => d.y) || 0) + nodeH;
    const scale = Math.min(_width / (treeW + 200), height / (treeH + 200), 0.85);
    const tx = _width / 2 - ((minX + maxX) / 2) * scale;
    svg.call(d3.zoom().scaleExtent([0.05, 4]).on('zoom', e => g.attr('transform', e.transform))
      .transform, d3.zoomIdentity.translate(tx, 60).scale(scale));

    // Draw links — clean straight elbow connectors
    links.forEach(link => {
      const sx = link.source.x;
      const sy = link.source.y + 22;
      const tx2 = link.target.x;
      const ty = link.target.y - 22;
      const midY = (sy + ty) / 2;

      g.append('path')
        .attr('d', `M${sx},${sy} L${sx},${midY} L${tx2},${midY} L${tx2},${ty}`)
        .attr('fill', 'none')
        .attr('stroke', '#d6d3d1')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.6);
    });

    // Draw nodes
    nodes.forEach(d => {
      const colors = d.data.isDeceased ? COLORS.deceased :
        d.data.gender === 'Male' ? COLORS.male : COLORS.female;
      const isHl = highlightId && d.data.id === highlightId;

      const nodeG = g.append('g')
        .attr('transform', `translate(${d.x},${d.y})`)
        .style('cursor', 'pointer')
        .on('click', () => navigate(`/members/${d.data.id}`))
        .on('mouseenter', function (event) {
          d3.select(this).select('rect').transition().duration(200).attr('stroke-width', 2.5);
          setTooltip({
            x: event.pageX, y: event.pageY,
            name: d.data.fullName,
            info: [
              d.data.age !== null ? `${d.data.isDeceased ? 'Lived' : 'Age'}: ${d.data.age}` : null,
              d.data.gotram ? `Gotram: ${d.data.gotram}` : null,
              d.data.pob ? `Born: ${d.data.pob}` : null,
            ].filter(Boolean).join(' | '),
          });
        })
        .on('mouseleave', function () {
          d3.select(this).select('rect').transition().duration(200).attr('stroke-width', 1.5);
          setTooltip(null);
        });

      // Card
      nodeG.append('rect')
        .attr('x', -70).attr('y', -22).attr('width', 140).attr('height', 44)
        .attr('rx', 8).attr('ry', 8)
        .attr('fill', isHl ? COLORS.highlight.bg : colors.light || colors.bg)
        .attr('stroke', isHl ? COLORS.highlight.border : colors.border)
        .attr('stroke-width', isHl ? 3 : 1.5)
        .attr('filter', 'url(#card-shadow-p)');

      // Name
      nodeG.append('text')
        .attr('text-anchor', 'middle').attr('y', -3)
        .attr('fill', colors.text || '#292524').attr('font-weight', '600')
        .attr('font-size', '11px').attr('font-family', '"Playfair Display", serif')
        .text(d.data.name.length > 14 ? d.data.name.slice(0, 13) + '..' : d.data.name);

      // Surname
      nodeG.append('text')
        .attr('text-anchor', 'middle').attr('y', 12)
        .attr('fill', '#a8a29e').attr('font-size', '9px').attr('font-family', 'Inter, sans-serif')
        .text(d.data.surname);

      // Deceased marker
      if (d.data.isDeceased) {
        nodeG.append('text').attr('x', 58).attr('y', -10).attr('font-size', '10px').attr('fill', '#a8a29e').text('✦');
      }

      // Spouse tag
      if (d.data.spouseName) {
        nodeG.append('text')
          .attr('text-anchor', 'middle').attr('y', 34)
          .attr('fill', COLORS.spouse.heart).attr('font-size', '8px').attr('font-family', 'Inter, sans-serif')
          .text(`♥ ${d.data.spouseName}`);
      }
    });

    // Label + unlinked count
    const linkedIds = new Set();
    nodes.forEach(n => { linkedIds.add(n.data.id); if (n.data.spouseId) linkedIds.add(n.data.spouseId); });
    const unlinked = members.filter(m => !linkedIds.has(m.id));
    g.append('text').attr('x', minX - 60).attr('y', -30)
      .attr('fill', '#a8a29e').attr('font-size', '12px').attr('font-family', 'Inter, sans-serif')
      .text(`Pedigree — ${nodes.length} members shown${unlinked.length > 0 ? `, ${unlinked.length} unlinked` : ''}`);

  }, [members, navigate, highlightId, buildTreeData]);

  // ========================
  // FAN CHART VIEW (Sunburst descendant chart — generations radiate outward)
  // ========================
  const drawFanChart = useCallback((svg, g, width, height) => {
    const defs = svg.append('defs');
    const shadow = defs.append('filter').attr('id', 'card-shadow-f').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    shadow.append('feDropShadow').attr('dx', '0').attr('dy', '1').attr('stdDeviation', '2').attr('flood-color', 'rgba(0,0,0,0.08)');

    // Use same tree data as banyan — full descendant tree
    const treeData = buildTreeData();
    if (!treeData) return;

    const hierarchy = d3.hierarchy(treeData, d => d.children);
    const hasVirtualRoot = treeData.isVirtualRoot;
    const maxRadius = Math.min(width, height) / 2 - 60;

    // Use D3 partition for sunburst layout
    const partition = d3.partition().size([2 * Math.PI, maxRadius]);
    hierarchy.sum(() => 1);
    partition(hierarchy);

    const cx = width / 2;
    const cy = height / 2;
    g.attr('transform', `translate(${cx},${cy})`);

    const arcGen = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1)
      .padAngle(0.01)
      .padRadius(maxRadius / 3);

    const allNodes = hierarchy.descendants();
    const nodes = hasVirtualRoot ? allNodes.filter(d => !d.data.isVirtualRoot) : allNodes;

    nodes.forEach((d, idx) => {
      const person = d.data;
      const colors = person.isDeceased ? COLORS.deceased :
        person.gender === 'Male' ? COLORS.male : COLORS.female;
      const isHl = highlightId && person.id === highlightId;

      const wedge = g.append('g')
        .style('cursor', 'pointer')
        .on('click', () => navigate(`/members/${person.id}`))
        .on('mouseenter', function (event) {
          d3.select(this).select('path').transition().duration(200).attr('stroke-width', 2.5);
          setTooltip({
            x: event.pageX, y: event.pageY,
            name: person.fullName,
            info: [
              person.age !== null ? `${person.isDeceased ? 'Lived' : 'Age'}: ${person.age}` : null,
              person.gotram ? `Gotram: ${person.gotram}` : null,
              person.spouseName ? `Spouse: ${person.spouseName}` : null,
            ].filter(Boolean).join(' | '),
          });
        })
        .on('mouseleave', function () {
          d3.select(this).select('path').transition().duration(200).attr('stroke-width', 1);
          setTooltip(null);
        });

      // Real root nodes (depth 0, or depth 1 when virtual root): draw as circle
      const isRealRoot = hasVirtualRoot ? d.depth === 1 : d.depth === 0;
      if (isRealRoot && !hasVirtualRoot) {
        wedge.append('circle')
          .attr('cx', 0).attr('cy', 0).attr('r', d.y1)
          .attr('fill', isHl ? COLORS.highlight.bg : colors.bg)
          .attr('stroke', isHl ? COLORS.highlight.border : colors.border)
          .attr('stroke-width', isHl ? 3 : 2)
          .attr('filter', 'url(#card-shadow-f)');

        wedge.append('text').attr('text-anchor', 'middle').attr('y', -5)
          .attr('fill', colors.text).attr('font-weight', '700').attr('font-size', '13px')
          .attr('font-family', '"Playfair Display", serif')
          .text(person.name);
        wedge.append('text').attr('text-anchor', 'middle').attr('y', 12)
          .attr('fill', '#a8a29e').attr('font-size', '10px').attr('font-family', 'Inter, sans-serif')
          .text(person.surname);
        return;
      }

      // Arc wedge
      wedge.append('path')
        .attr('d', arcGen(d))
        .attr('fill', isHl ? COLORS.highlight.bg : colors.bg)
        .attr('stroke', isHl ? COLORS.highlight.border : colors.border)
        .attr('stroke-width', isHl ? 2.5 : 1)
        .attr('opacity', 0)
        .transition().duration(500).delay(d.depth * 80 + idx * 10)
        .attr('opacity', 0.9);

      // Label — only if arc is wide enough
      const angle = d.x1 - d.x0;
      const arcLength = angle * ((d.y0 + d.y1) / 2);
      if (arcLength > 25) {
        const midAngle = (d.x0 + d.x1) / 2 - Math.PI / 2;
        const labelR = (d.y0 + d.y1) / 2;
        const lx = labelR * Math.cos(midAngle);
        const ly = labelR * Math.sin(midAngle);
        const maxChars = Math.max(3, Math.floor(arcLength / 6));
        const label = person.name.length > maxChars ? person.name.slice(0, maxChars - 1) + '..' : person.name;

        // Rotate text to follow the arc
        let rotation = (midAngle * 180) / Math.PI;
        if (rotation > 90) rotation -= 180;
        if (rotation < -90) rotation += 180;

        wedge.append('text')
          .attr('x', lx).attr('y', ly)
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
          .attr('transform', `rotate(${rotation},${lx},${ly})`)
          .attr('fill', colors.text || '#57534e')
          .attr('font-size', d.depth <= 2 ? '9px' : '7px')
          .attr('font-weight', '600')
          .attr('font-family', 'Inter, sans-serif')
          .text(label)
          .attr('opacity', 0)
          .transition().duration(400).delay(d.depth * 80 + idx * 10 + 200)
          .attr('opacity', 1);
      }
    });

    // Generation rings labels
    const depthOffset = hasVirtualRoot ? 1 : 0;
    const maxDepth = d3.max(nodes, d => d.depth) || 0;
    for (let i = (hasVirtualRoot ? 2 : 1); i <= maxDepth; i++) {
      const r = (maxRadius / (maxDepth + 1)) * (i + 1);
      const genIndex = i - depthOffset;
      g.append('text')
        .attr('x', 5).attr('y', -r + 12)
        .attr('fill', '#d6d3d1').attr('font-size', '8px').attr('font-family', 'Inter, sans-serif')
        .text(`Gen ${genIndex + 1}`);
    }

    // Label
    g.append('text').attr('x', -cx + 15).attr('y', -cy + 25)
      .attr('fill', '#a8a29e').attr('font-size', '12px').attr('font-family', 'Inter, sans-serif')
      .text(`Fan chart — ${nodes.length} members across ${maxDepth + 1} generations`);

  }, [members, navigate, highlightId, buildTreeData]);

  // ========================
  // MAIN DRAW FUNCTION
  // ========================
  const drawTree = useCallback(() => {
    if (!svgRef.current || members.length === 0) return;

    // Cancel any running particle animation
    if (particlesRef.current) {
      cancelAnimationFrame(particlesRef.current);
      particlesRef.current = null;
    }

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 600;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('background', viewMode === 'radial' ? 'radial-gradient(circle at center, #fefce8 0%, #fafaf9 70%)' :
        viewMode === 'timeline' ? 'linear-gradient(180deg, #f5f5f4 0%, #fafaf9 100%)' :
        'linear-gradient(180deg, #fefce8 0%, #fafaf9 30%, #f0fdf4 100%)');

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.05, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    if (viewMode === 'pedigree') {
      drawPedigreeChart(svg, g, Math.max(width, 1200), height);
    } else if (viewMode === 'fan') {
      drawFanChart(svg, g, width, height);
    } else if (viewMode === 'timeline') {
      drawTimeline(svg, g, Math.max(width, members.length * 60 + 200), height);
    } else {
      // Banyan or Radial — need hierarchy
      svg.on('dblclick.zoom', () => {
        svg.transition().duration(500)
          .call(zoom.transform, d3.zoomIdentity.translate(width / 2, 80).scale(0.7));
      });

      const treeData = buildTreeData();
      if (!treeData) return;

      const hierarchy = d3.hierarchy(treeData, d => d.children);

      if (viewMode === 'banyan') {
        const nodeWidth = showSpouses ? 320 : 180;
        const nodeHeight = 110;
        const treeLayout = d3.tree()
          .nodeSize([nodeWidth, nodeHeight])
          .separation((a, b) => a.parent === b.parent ? 1 : 1.3);
        treeLayout(hierarchy);

        const nodes = hierarchy.descendants();
        const minX = d3.min(nodes, d => d.x);
        const maxX = d3.max(nodes, d => d.x);
        const treeWidth = maxX - minX + nodeWidth;
        const treeHeight = (d3.max(nodes, d => d.y) || 0) - (d3.min(nodes, d => d.y) || 0) + nodeHeight;
        const initialScale = Math.min(width / (treeWidth + 200), height / (treeHeight + 200), 0.9);
        const tx = width / 2 - ((minX + maxX) / 2) * initialScale;
        const ty = 80;
        svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(initialScale));

        drawBanyanTree(svg, g, width, height, treeData, hierarchy);
      } else {
        drawRadialTree(svg, g, width, height, treeData, hierarchy);
      }

      // Unlinked = members not in the tree hierarchy (and not a spouse of someone in it)
      const linkedIds = new Set();
      hierarchy.descendants().forEach(n => {
        if (!n.data.isVirtualRoot) {
          linkedIds.add(n.data.id);
          if (n.data.spouseId) linkedIds.add(n.data.spouseId);
        }
      });
      const unlinked = members.filter(m => !linkedIds.has(m.id));
      if (unlinked.length > 0) {
        svg.append('text')
          .attr('x', 15).attr('y', height - 15)
          .attr('fill', '#a8a29e').attr('font-size', '11px')
          .attr('font-family', 'Inter, sans-serif')
          .text(`${unlinked.length} member(s) not linked to main tree`);
      }
    }

  }, [members, viewMode, highlightId, showSpouses, buildTreeData, drawBanyanTree, drawRadialTree, drawTimeline, drawPedigreeChart, drawFanChart]);

  useEffect(() => {
    drawTree();
    const observer = new ResizeObserver(drawTree);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      if (particlesRef.current) {
        cancelAnimationFrame(particlesRef.current);
      }
    };
  }, [drawTree]);

  // Search
  useEffect(() => {
    if (!search.trim()) { setHighlightId(null); return; }
    const found = members.find(m =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
    );
    setHighlightId(found?.id || null);
  }, [search, members]);

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Family Tree</h1>
          <p className="text-stone-500 text-sm mt-1">Scroll to zoom, drag to pan, double-click to reset. Click +/− to collapse branches.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode switcher */}
          <div className="flex bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
            {[
              { key: 'banyan', label: 'Banyan', icon: '🌳' },
              { key: 'radial', label: 'Radial', icon: '🔆' },
              { key: 'pedigree', label: 'Pedigree', icon: '🏛️' },
              { key: 'fan', label: 'Fan Chart', icon: '🌀' },
              { key: 'timeline', label: 'Timeline', icon: '📅' },
            ].map(mode => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key)}
                className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === mode.key
                    ? 'bg-saffron-50 text-saffron-700 border-b-2 border-saffron-500'
                    : 'text-stone-500 hover:bg-stone-50'
                }`}
              >
                <span>{mode.icon}</span>
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Toggle spouses */}
          {viewMode === 'banyan' && (
            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm cursor-pointer shadow-sm">
              <input
                type="checkbox"
                className="rounded border-stone-300 text-saffron-600"
                checked={showSpouses}
                onChange={e => setShowSpouses(e.target.checked)}
              />
              Spouses
            </label>
          )}

          {/* Collapse all / Expand all */}
          {viewMode === 'banyan' && (
            <div className="flex gap-1">
              <button
                onClick={() => {
                  members.forEach(m => {
                    const hasChildren = members.some(c => c.fatherId === m.id || c.motherId === m.id);
                    if (hasChildren) collapsedRef.current.add(m.id);
                  });
                  forceUpdate(n => n + 1);
                }}
                className="px-2 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-500 hover:bg-stone-50 shadow-sm"
                title="Collapse all"
              >
                ⊟
              </button>
              <button
                onClick={() => {
                  collapsedRef.current.clear();
                  forceUpdate(n => n + 1);
                }}
                className="px-2 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-500 hover:bg-stone-50 shadow-sm"
                title="Expand all"
              >
                ⊞
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <input
              className="input w-48 pl-8"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <svg className="w-4 h-4 absolute left-2.5 top-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-stone-500 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-200 border border-blue-500 inline-block" /> Male</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-pink-200 border border-pink-500 inline-block" /> Female</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-stone-200 border border-stone-400 inline-block" /> Deceased ✦</span>
        <span className="flex items-center gap-1">♥ Spouse</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" /> Flowing particles</span>
        <span className="flex items-center gap-1 text-stone-400">+/− Collapse</span>
      </div>

      {/* Tree Canvas */}
      <div ref={containerRef} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden relative" style={{ height: 'calc(100% - 120px)' }}>
        {members.length === 0 ? (
          <div className="flex items-center justify-center h-full text-stone-400">
            <p>No family members yet. Add members to see the tree.</p>
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-full" />
        )}

        {/* Floating Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 bg-stone-800 text-white rounded-lg px-3 py-2 shadow-xl pointer-events-none"
            style={{ left: tooltip.x + 15, top: tooltip.y - 10 }}
          >
            <p className="font-semibold text-sm">{tooltip.name}</p>
            {tooltip.info && <p className="text-xs text-stone-300">{tooltip.info}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
