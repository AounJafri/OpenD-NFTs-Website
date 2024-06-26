import React, { useEffect, useState } from "react";
import Item from "./Item";
import PriceLabel from "./PriceLabel";

function Gallery(props) {
  const [Items,setItems] = useState();

  function fetchNFTs(){
    if(props.ids != undefined){
    setItems(
      props.ids.map((NFTid)=> (<Item id={NFTid} key={NFTid.toText()} itemRole={props.role}/>))
    )
  }
  }
  
  useEffect(()=> {
    fetchNFTs();
  }, [])

  return (
    <div className="gallery-view">
      <h3 className="makeStyles-title-99 Typography-h3">{props.title}</h3>
      <div className="disGrid-root disGrid-container disGrid-spacing-xs-2">
        <div className="disGrid-root disGrid-item disGrid-grid-xs-12">
          <div className="disGrid-root disGrid-container disGrid-spacing-xs-5 disGrid-justify-content-xs-center">
          {Items}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gallery;
