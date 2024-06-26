import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { idlFactory } from "../../../declarations/nft";
import { idlFactory as tokenIdlFactory} from "../../../declarations/token";
import Button from "./Button";
import { opend } from "../../../declarations/opend";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";
import { canisterId } from "../../../declarations/opend/index";

function Item(props) {
  
  const [name,setName] = useState();
  const [owner,setOwner] = useState();
  const [image,setImage] = useState();
  const [button,setButton] = useState();
  const [priceInput,setPriceInput] = useState();
  const [loaderHidden,setLoaderHidden] = useState(true);
  const [blur,setBlur] = useState();
  const [listed,setListed] = useState("");
  const [priceLabel,setPriceLabel] = useState();
  const [shouldDisplay, setDisplay] = useState(true);

  const id = props.id;
  const localhost = "http://localhost:8080/";

  const agent = new HttpAgent({ host: localhost});
  agent.fetchRootKey();
  let NFTActor;

  async function loadNFT(){
     NFTActor = await Actor.createActor(idlFactory,{
      agent,
      canisterId : id
    })
    const Name = await NFTActor.getName();
    const Prinowner = await NFTActor.getOwner();
    const imageData = await NFTActor.getAsset();
    const imageContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(new Blob([imageContent.buffer] , { type: "image/png"}));
    setName(Name);
    setOwner(Prinowner.toText());
    setImage(image);

    if(props.itemRole == "collection"){
    const listed = await opend.isListed(props.id);

    if (listed) {
      setOwner("OpenD");
      setBlur({filter: "blur(4px)"});
      setListed("Listed")
    } else {
      setButton(<Button handleClick={handleSell} text="Sell"/>);
    }
  }else if(props.itemRole=="discover"){
    const originalOwner = await opend.getOriginalOwner(props.id);

    if(originalOwner.toText() !== CURRENT_USER_ID.toText()){
      setButton(<Button handleClick={handleBuy} text="Buy"/>);
    }
    const price = await opend.getListedNFTsPrice(props.id);
    setPriceLabel(<PriceLabel priceLabel={price.toString()} />)

  }

  }

  useEffect(()=> {
    loadNFT();
  },[])

  async function handleBuy(){
    console.log("buy clicked");
    setLoaderHidden(false);
    const tokenActor = await Actor.createActor(tokenIdlFactory,{
      agent,
      canisterId: Principal.fromText("xta5m-jiaaa-aaaaa-aaawa-cai")
    });
    const sellerId = await opend.getOriginalOwner(props.id);
    const itemPrice = await opend.getListedNFTsPrice(props.id);

    const result = await tokenActor.transfer(sellerId,itemPrice);
    console.log(result);
    if(result == "Success"){
      const transferResult = await opend.completePurchase(props.id, sellerId, CURRENT_USER_ID);
      console.log("purchase : " + transferResult);
    } 

    setLoaderHidden(true);
    setDisplay(false);

  }


  let price;
  function handleSell(){

    console.log("Sell clicked");

    setPriceInput(<input
      placeholder="Price in DANG"
      type="number"
      className="price-input"
      value={price}
      onChange={(e)=> price=e.target.value}
    />)
    setButton(<Button handleClick={sellItem} text="Confirm"/>)

  }

  async function sellItem(){
    setBlur({filter: "blur(4px)"})
    setLoaderHidden(false);
    console.log("confirm clicked");
    const listingResult = await opend.listItem(props.id, Number(price));
    console.log("Listing" + listingResult);

    if(listingResult=="Success"){
      const opendId = await opend.getOpenDCanisterId();
      const transferRsult = await NFTActor.transferOwnership(opendId);
      console.log("Transfer" + transferRsult);

      if(transferRsult=="Success"){
        setLoaderHidden(true);
        setPriceInput();
        setButton();
        setOwner("OpenD");
      }
    }
  }

  return (
    <div style={{display: shouldDisplay ? "inline" : "none"}} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div className="lds-ellipsis" hidden={loaderHidden}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
        <div className="disCardContent-root">
            {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"> {listed}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
