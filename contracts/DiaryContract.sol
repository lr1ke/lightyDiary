// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DiaryContract {
    struct Entry {
        uint256 id;
        string title;
        string content;
        address owner;
        uint256 timestamp;
        bool isCollaborative;
        bool isFinalized;
    }

    struct Contribution {
        address contributor;
        string content;
        uint256 timestamp;
    }

    Entry[] public entries;
    mapping(address => uint256[]) public userEntries;
    mapping(uint256 => Contribution[]) public entryContributions;
    uint256 public entryCount;

    event EntryCreated(uint256 indexed entryId, address indexed owner, string content, bool isCollaborative);
    event ContributionAdded(uint256 indexed entryId, address indexed contributor, string content);
    event EntryFinalized(uint256 indexed entryId);

    function createEntry(string memory content) public {
        entries.push(Entry({
            id: entryCount,
            title: "",
            content: content,
            owner: msg.sender,
            timestamp: block.timestamp,
            isCollaborative: false,
            isFinalized: true
        }));
        
        userEntries[msg.sender].push(entryCount);
        entryCount++;
        
        emit EntryCreated(entryCount - 1, msg.sender, content, false);
    }

    function createCollaborativeEntry(string memory _title, string memory _content) public {
        entries.push(Entry({
            id: entryCount,
            title: _title,
            content: _content,
            owner: msg.sender,
            timestamp: block.timestamp,
            isCollaborative: true,
            isFinalized: false
        }));

        userEntries[msg.sender].push(entryCount);
        entryCount++;

        emit EntryCreated(entryCount - 1, msg.sender, _content, true);
    }

    function addContribution(uint256 entryId, string memory content) public {
        require(!entries[entryId].isFinalized, "Entry is finalized");
        require(entries[entryId].isCollaborative, "Not a collaborative entry");

        Contribution memory newContribution = Contribution({
            contributor: msg.sender,
            content: content,
            timestamp: block.timestamp
        });

        entryContributions[entryId].push(newContribution);
        emit ContributionAdded(entryId, msg.sender, content);
    }

    function finalizeEntry(uint256 entryId) public {
        require(msg.sender == entries[entryId].owner, "Only owner can finalize");
        require(!entries[entryId].isFinalized, "Already finalized");

        entries[entryId].isFinalized = true;
        emit EntryFinalized(entryId);
    }

    function getEntryContributions(uint256 entryId) public view returns (Contribution[] memory) {
        return entryContributions[entryId];
    }

    function getMyEntries() public view returns (Entry[] memory) {
        return getUserEntries(msg.sender);
    }

    function getUserEntries(address user) public view returns (Entry[] memory) {
        uint256[] memory userEntryIds = userEntries[user];
        Entry[] memory result = new Entry[](userEntryIds.length);
        
        for (uint256 i = 0; i < userEntryIds.length; i++) {
            result[i] = entries[userEntryIds[i]];
        }
        
        return result;
    }

    function getAllEntries() public view returns (Entry[] memory) {
        Entry[] memory result = new Entry[](entryCount);
        for (uint256 i = 0; i < entryCount; i++) {
            result[i] = entries[i];
        }
        return result;
    }
}
