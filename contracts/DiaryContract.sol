// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DiaryContract {
    struct Entry {
        uint id;
        string content;
        address owner;
        uint timestamp;
    }

    mapping(uint => Entry) public entries;
    uint public entryCount;

    event EntryCreated(uint id, string content, address owner, uint timestamp);

    function createEntry(string memory _content) public {
        entryCount++;
        entries[entryCount] = Entry(entryCount, _content, msg.sender, block.timestamp);
        emit EntryCreated(entryCount, _content, msg.sender, block.timestamp);
    }

    function getEntry(uint _id) public view returns (Entry memory) {
        return entries[_id];
    }

    function getAllEntries() public view returns (Entry[] memory) {
        Entry[] memory allEntries = new Entry[](entryCount);
        for (uint i = 1; i <= entryCount; i++) {
            allEntries[i - 1] = entries[i];
        }
        return allEntries;
    }
}
