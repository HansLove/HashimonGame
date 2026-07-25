//Zones give the world its ecology. Each zone weights the TYPES a player is
//likely to meet there, so the same map reliably yields a coherent set of
//Hashimons — nature in the garden, tech on the street — rather than pure noise.
//
//This is "relative determinism": mostly the zone's own types, with a small
//chance of an off-type surprise. A Pixel Hashimon will not wander into a
//vegetable garden unless the rare off-type roll fires.
window.HashimonZones = {
  street: {
    name: "Anchovy Avenue",
    //weight -> relative likelihood of that type appearing here
    types: { pixel: 4, electrico: 4, metal: 2 },
    offTypeChance: 0.06,
  },
  greenKitchen: {
    name: "Green Kitchen",
    types: { vegetal: 4, tierra: 3, hongo: 3 },
    offTypeChance: 0.05,
  },
  streetNorth: {
    name: "North Quarter",
    types: { astro: 4, mental: 3, sueno: 3 },
    offTypeChance: 0.06,
  },
  diningRoom: {
    name: "Dining Hall",
    types: { agua: 4, aire: 3 },
    offTypeChance: 0.05,
  },
  kitchen: {
    name: "The Kitchen",
    types: { fuego: 5 },
    offTypeChance: 0.04,
  },

  //--- Endless biomes: each generated map picks one, biasing its ecology so the
  //terrain and the Hashimons you meet on it agree. ---
  forest:  { name: "Meadow",  types: { vegetal: 4, tierra: 3, hongo: 3 }, offTypeChance: 0.07 },
  circuit: { name: "Circuit", types: { pixel: 4, electrico: 4, metal: 2 }, offTypeChance: 0.07 },
  tide:    { name: "Tide",    types: { agua: 4, aire: 3 },                 offTypeChance: 0.07 },
  astral:  { name: "Astral",  types: { astro: 4, mental: 3, sueno: 3 },    offTypeChance: 0.07 },
  ember:   { name: "Ember",   types: { fuego: 4, metal: 2 },               offTypeChance: 0.07 },
}

window.HashimonEncounters = {

  //Every species that can be fielded as a wild individual, indexed by its type.
  //Built once from the catalog so encounters never have to scan it.
  speciesByType() {
    if (this._byType) { return this._byType; }
    const map = {};
    Object.keys(Hashimons).forEach(key => {
      const sp = Hashimons[key];
      if (!sp.zones || !sp.zones.length) { return; }   //starter etc. are not wild
      (map[sp.type] = map[sp.type] || []).push(key);
    })
    this._byType = map;
    return map;
  },

  //Weighted roll over a zone's type table, with a small off-type surprise.
  rollType(zone) {
    const byType = this.speciesByType();

    //Off-type: pick any type that actually has a wild species behind it.
    if (Math.random() < (zone.offTypeChance || 0)) {
      const all = Object.keys(byType);
      if (all.length) { return all[Math.floor(Math.random() * all.length)]; }
    }

    const entries = Object.keys(zone.types).filter(t => byType[t] && byType[t].length);
    const total = entries.reduce((s, t) => s + zone.types[t], 0);
    let r = Math.random() * total;
    for (const t of entries) {
      r -= zone.types[t];
      if (r <= 0) { return t; }
    }
    return entries[0];
  },

  //A birth nonce unique to this encounter, so every wild individual gets its own
  //DNA. A monotonic counter guarantees no two encounters collide even within the
  //same millisecond; the timestamp keeps nonces from repeating across sessions.
  _counter: 0,
  uniqueNonce() {
    this._counter = (this._counter + 1) % 1e6;
    return (Date.now() % 1e7) * 1e6 + this._counter;
  },

  //Rolls a wild Hashimon for a zone: picks a type, then a species of that type,
  //then mints a unique individual. Returns the individual and its provenance.
  rollWild(zoneId) {
    const zone = HashimonZones[zoneId];
    if (!zone) { throw new Error("Unknown zone: " + zoneId); }

    const byType = this.speciesByType();
    const typeKey = this.rollType(zone);
    const pool = byType[typeKey] || Object.values(byType)[0];
    const speciesKey = pool[Math.floor(Math.random() * pool.length)];

    const individual = HashimonSystem.createInstance(speciesKey, {
      birthNonce: this.uniqueNonce(),
    });
    return { zoneId, typeKey, speciesKey, individual };
  },

  //Wraps a rolled individual as a Battle enemy. Battle detects a full instance
  //(it has a dna) and fields it directly, so the creature you fight is the exact
  //individual you may capture.
  toWildEnemy(roll) {
    return {
      name: roll.individual.name,
      isWild: true,
      wildSpecies: roll.speciesKey,
      wildIndividual: roll.individual,
      hashimons: { a: roll.individual },
    };
  },

}
