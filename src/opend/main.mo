import Principal "mo:base/Principal";
import NFTActorClass "../NFT/nft";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import List "mo:base/List";
import Bool "mo:base/Bool";
import Iter "mo:base/Iter";

actor OpenD {
    Debug.print("Hello");
    private type Listing = {
        itemOwner: Principal;
        itemPrice: Nat;
    };

    var mapOfNFTs = HashMap.HashMap<Principal, NFTActorClass.NFT>(1, Principal.equal, Principal.hash);
    var mapOfOwners = HashMap.HashMap<Principal , List.List<Principal>>(1, Principal.equal, Principal.hash);
    var mapofListings = HashMap.HashMap<Principal, Listing>(1, Principal.equal, Principal.hash);

    public shared(msg) func mint(imgData: [Nat8], name: Text ): async Principal{

        let owner: Principal = msg.caller;

        // Debug.print(debug_show(Cycles.balance()));
        // Cycles.add(100_500_000_000);

        let newNft = await NFTActorClass.NFT(name ,owner ,imgData);

        // Debug.print(debug_show(Cycles.balance()));

        let nftPrincipalId = await newNft.getCanisterId();
        
        mapOfNFTs.put(nftPrincipalId, newNft);
        addToOwnershipMap(owner, nftPrincipalId);

        return nftPrincipalId;
    };

    private func addToOwnershipMap(owner: Principal, newNFTId: Principal){
        var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(owner)) {
            case null List.nil<Principal>();
            case (?result) result;
        };

        ownedNFTs := List.push(newNFTId, ownedNFTs);
        mapOfOwners.put(owner, ownedNFTs);
    };

    public query func getOwnedNFTs(user: Principal): async [Principal] {
        var userNFTs : List.List<Principal> = switch (mapOfOwners.get(user)) {
            case null List.nil<Principal>();
            case (?result) result;
        };

        return List.toArray(userNFTs);
    };

    public query func getListings() : async [Principal]{
        let ids= Iter.toArray(mapofListings.keys());
        return ids;
    };

    public shared(msg) func listItem(id: Principal, price: Nat): async Text {

        var item: NFTActorClass.NFT = switch (mapOfNFTs.get(id)){
            case null return "No such NFT exists.";
            case (?result) result;
        };
        
        let owner = await item.getOwner();

        if(Principal.equal(owner,msg.caller)){

            let newListing: Listing = {
                itemOwner = owner;
                itemPrice = price;
            };

            mapofListings.put(id,newListing);
            return "Success";

        }else{
            return "You are not the owner of this NFT."
        }
    };

    public query func getOpenDCanisterId():async Principal{
        return Principal.fromActor(OpenD);
    };

    public query func isListed(id: Principal) : async Bool{
        if(mapofListings.get(id) == null){
            return false;
        }else{
            return true;
        }
    };

    public query func getOriginalOwner(id:Principal): async Principal{
        var templisting: Listing = switch (mapofListings.get(id)){
            case null return Principal.fromText("");
            case (?result) result;
        };

        return templisting.itemOwner;
    };

    public query func getListedNFTsPrice(id:Principal): async Nat{
        var temp2listing: Listing = switch (mapofListings.get(id)){
            case null return 0;
            case (?result) result;
        };

        return temp2listing.itemPrice;
    };


    public shared(msg) func completePurchase(id: Principal, ownerId: Principal, newOwnerId: Principal) : async Text {
        var purchasedNFT: NFTActorClass.NFT = switch (mapOfNFTs.get(id)) {
            case null return "NFT does not exist.";
            case (?result) result;
        };

        var transferResult = await purchasedNFT.transferOwnership(newOwnerId);
        if(transferResult == "Success"){
            mapofListings.delete(id);

            var ownedNFTsList: List.List<Principal> = switch(mapOfOwners.get(ownerId)){
                case null List.nil<Principal>();
                case (?result) result;
            };

            ownedNFTsList := List.filter(ownedNFTsList, func (listItemId: Principal): Bool{
                return listItemId != id;
            });

            addToOwnershipMap(newOwnerId, id);
            return "Success";
        } else {
            return transferResult;
        }

    }




};
