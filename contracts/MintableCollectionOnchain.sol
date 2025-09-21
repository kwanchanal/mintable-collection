// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/// @title mintable-collection (on-chain HTML)
/// @notice ERC721 + EIP-2981 (royalty), payable mint (default 0.1 ETH), on-chain metadata+HTML
contract MintableCollectionOnchain is ERC721, ERC2981, Ownable {
    using Strings for uint256;

    uint256 public nextTokenId = 1;
    uint256 public mintPrice = 0.1 ether;

    struct Traits { string collection; string seed; }
    mapping(uint256 => Traits) public traits;

    constructor(address royaltyReceiver, uint96 royaltyBps)
        ERC721("mintable-collection (on-chain)", "MINT")
        Ownable()
    {
        _setDefaultRoyalty(royaltyReceiver, royaltyBps); // e.g., 1000 = 10%
    }

    // --- Admin ---
    function setMintPrice(uint256 weiPrice) external onlyOwner { mintPrice = weiPrice; }
    function withdraw(address payable to) external onlyOwner { to.transfer(address(this).balance); }

    // --- Mint ---
    function mint(string memory collection, string memory seed) external payable returns (uint256) {
        require(msg.value >= mintPrice, "Price is 0.1 ETH");
        uint256 id = nextTokenId++;
        _safeMint(msg.sender, id);
        traits[id] = Traits(collection, seed);
        return id;
    }

    // --- Metadata ---
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "nonexistent");
        Traits memory t = traits[tokenId];
        string memory name = string(abi.encodePacked("mintable-collection #", tokenId.toString()));
        string memory desc = "On-chain HTML generative art (collections with seed).";
        string memory html = buildHTML(t.collection, t.seed);
        string memory anim = string(abi.encodePacked("data:text/html;base64,", Base64.encode(bytes(html))));
        string memory image = string(abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svgPlaceholder(t.collection, t.seed)))));

        string memory json = string(abi.encodePacked(
            '{"name":"', name,
            '","description":"', desc,
            '","animation_url":"', anim,
            '","image":"', image,
            '","attributes":[{"trait_type":"collection","value":"', t.collection,
            '"},{"trait_type":"seed","value":"', t.seed, '"}]}'
        ));
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    // Minimal HTML + Canvas drawing with seeded PRNG (no external libs)
    function buildHTML(string memory collection, string memory seed) internal pure returns (string memory) {
        string memory head = "<!doctype html><html><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>mintable-collection</title><style>html,body{margin:0;background:#111;color:#eee}canvas{display:block;width:100vw;height:100vh}</style><body><canvas id='c'></canvas><script>";
        string memory js1 =
        "let collection='%COL%';let seed='%SEED%';"
        "let a=document.getElementById('c'),x=a.getContext('2d');"
        "function r(){let h=1779033703^seed.length;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=(h<<13)|(h>>>19);}return function(){h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);h^=h>>>16;return (h>>>0)/4294967296;}}"
        "let rng=r();"
        "function srand(min,max){return min+rng()*(max-min)}function srange(a,b){return Math.floor(srand(a,b))}"
        "function resize(){a.width=innerWidth;a.height=innerHeight;draw()}window.onresize=resize;";
        string memory js2 =
        "function draw(){x.fillStyle='#121212';x.fillRect(0,0,a.width,a.height);if(collection==='rings')dr();else fl();}"
        "function dr(){let pal=[[240,200,210,0.8],[120,155,135,0.8],[245,215,120,0.8],[202,122,92,0.8],[220,220,230,0.8]];let clusters=srange(3,6);for(let n=0;n<clusters;n++){let cx=srand(a.width*.1,a.width*.9),cy=srand(a.height*.1,a.height*.9),base=srand(Math.min(a.width,a.height)*.12,Math.min(a.width,a.height)*.24);for(let r=0;r<srange(8,15);r++){let c=pal[srange(0,pal.length)],den=srand(.035,.08),wob=srand(Math.min(a.width,a.height)*.012,Math.min(a.width,a.height)*.028);x.beginPath();for(let ang=0;ang<Math.PI*2;ang+=den){let nx=Math.cos(ang)*.7+r*.03,ny=Math.sin(ang)*.7+r*.03;let nf=(noise(nx,ny))*wob;let rad=base+r*srand(Math.min(a.width,a.height)*.009,Math.min(a.width,a.height)*.018)+nf;let px=cx+Math.cos(ang)*rad,py=cy+Math.sin(ang)*rad;if(ang===0)x.moveTo(px,py);else x.lineTo(px,py);}x.closePath();x.strokeStyle=`rgba(${c[0]},${c[1]},${c[2]},${c[3]})`;x.lineWidth=srand(.8,2.2);x.stroke();}}"
        "function fl(){x.strokeStyle='rgba(255,255,255,.8)';x.lineWidth=1;let lines=srange(40,80);for(let i=0;i<lines;i++){let y=srand(0,a.height);x.beginPath();for(let px=0;px<a.width;px+=Math.max(4,a.width/120)){let off=(noise(px*.01,y*.005,i*.1))*(a.width*.2)-(a.width*.1);if(px===0)x.moveTo(px,y+off);else x.lineTo(px,y+off);}x.stroke();}}"
        "function noise(x,y,z){function f(t){return t*t*(3-2*t)}function hash(n){let s=Math.sin(n)*43758.5453;return s-Math.floor(s)}"
        "let X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z||0);x-=X;y-=Y;z=(z||0)-Z;let u=f(x),v=f(y),w=f(z);"
        "function g(i,j,k){return hash(X+i+57*(Y+j)+113*(Z+k))}"
        "let n0=g(0,0,0),n1=g(1,0,0),n2=g(0,1,0),n3=g(1,1,0);"
        "let ix0=n0+(n1-n0)*u;let ix1=n2+(n3-n2)*u;let iy=ix0+(ix1-ix0)*v;return iy;}"
        "resize();";
        string memory tail="</script></body></html>";

        js1 = replace(js1, "%COL%", collection);
        js1 = replace(js1, "%SEED%", seed);
        return string(abi.encodePacked(head, js1, js2, tail));
    }

    function svgPlaceholder(string memory collection, string memory seed) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><rect width='100%' height='100%' fill='#111'/>",
            "<text x='50%' y='42%' fill='#fff' font-family='monospace' font-size='20' text-anchor='middle'>mintable-collection</text>",
            "<text x='50%' y='52%' fill='#bbb' font-family='monospace' font-size='14' text-anchor='middle'>collection: ", collection, "</text>",
            "<text x='50%' y='58%' fill='#bbb' font-family='monospace' font-size='14' text-anchor='middle'>seed: ", seed, "</text>",
            "</svg>"
        ));
    }

    function replace(string memory subject, string memory search, string memory replacement) internal pure returns (string memory) {
        bytes memory s = bytes(subject);
        bytes memory find = bytes(search);
        bytes memory rep = bytes(replacement);
        uint256 i = indexOf(s, find);
        if (i == type(uint256).max) return subject;
        bytes memory out = new bytes(s.length - find.length + rep.length);
        uint256 k = 0; uint256 j = 0;
        for (; j < i; j++) out[k++] = s[j];
        for (uint256 m = 0; m < rep.length; m++) out[k++] = rep[m];
        for (j = j + find.length; j < s.length; j++) out[k++] = s[j];
        return string(out);
    }

    function indexOf(bytes memory s, bytes memory find) internal pure returns (uint256) {
        if (find.length == 0 || find.length > s.length) return type(uint256).max;
        for (uint256 i = 0; i <= s.length - find.length; i++) {
            bool ok = true;
            for (uint256 j = 0; j < find.length; j++) {
                if (s[i + j] != find[j]) { ok = false; break; }
            }
            if (ok) return i;
        }
        return type(uint256).max;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
