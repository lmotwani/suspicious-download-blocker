class BloomFilter {
    constructor(size, hashCount) {
        this.size = size;
        this.hashCount = hashCount;
        this.bitArray = new Uint8Array(size);
    }

    _hash(value, seed) {
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
            hash = (hash + seed * value.charCodeAt(i)) % this.size;
        }
        return hash;
    }

    add(value) {
        for (let i = 0; i < this.hashCount; i++) {
            const hash = this._hash(value, i + 1);
            this.bitArray[hash] = 1;
        }
    }

    contains(value) {
        for (let i = 0; i < this.hashCount; i++) {
            const hash = this._hash(value, i + 1);
            if (this.bitArray[hash] === 0) {
                return false;
            }
        }
        return true;
    }
}

export default BloomFilter;
