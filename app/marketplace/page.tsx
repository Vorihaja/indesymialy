"use client";
import { useState } from "react";
import { 
  ShoppingBag, ShieldCheck, CreditCard, Smartphone, 
  CheckCircle2, ArrowRight, Search, Info, Trash2, X, Plus, Minus
} from "lucide-react";

// Types
interface Product {
  id: string;
  name: string;
  category: "equipement" | "billetterie" | "partenariat";
  type: "Vente" | "Location" | "Abonnement" | "Accès";
  price: number;
  priceLabel: string;
  image: string;
  description: string;
  specs?: string[];
  stock: number | string;
}

interface CartItem {
  product: Product;
  quantity: number;
  options?: {
    durationDays?: number;
    ticketZone?: string;
  };
}

// DATA ENRICHIE DE LA MARKETPLACE[cite: 1]
const PRODUCTS_REGISTRY: Product[] = [
  {
    id: "eq-gants-premium",
    name: "Gants de Boxe Premium INDESY",
    category: "equipement",
    type: "Vente",
    price: 85000,
    priceLabel: "85 000 Ar",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/affiche%201",
    description: "Cuir véritable renforcé, mousse triple densité. Idéal pour les sparring intensifs en MMA et Kickboxing. Certifié conforme aux normes MFN.",
    specs: ["Taille: 12oz / 14oz", "Protection poignet renforcée", "Fermeture Velcro ultra-large"],
    stock: 14
  },
  {
    id: "eq-plastron-tkd",
    name: "Plastron de Protection Professionnel",
    category: "equipement",
    type: "Location",
    price: 8000,
    priceLabel: "8 000 Ar / jour",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/affiche%201",
    description: "Plastron réversible haute protection pour compétitions et entraînements intensifs. Absorption des chocs testée en laboratoire.",
    specs: ["Tailles dispo: M, L, XL", "Réversible Bleu/Rouge", "Nettoyage antibactérien inclus"],
    stock: "Disponible immédiatement"
  },
  {
    id: "eq-pao-frappe",
    name: "Pao de Frappe Professionnel (Paire)",
    category: "equipement",
    type: "Vente",
    price: 120000,
    priceLabel: "120 000 Ar",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/affiche%201",
    description: "Boucliers de frappe incurvés pour l'entraînement aux coups de pied et de genou. Poignées rivetées ultra-résistantes.",
    specs: ["Vendu par paire", "Mousse haute densité 10cm", "Prise ergonomique"],
    stock: 5
  },
  {
    id: "tkt-mfn3-vip",
    name: "Pass VIP - MAHAJANGA FIGHT NIGHT V3",
    category: "billetterie",
    type: "Accès",
    price: 150000,
    priceLabel: "150 000 Ar",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/combattant_1",
    description: "Accès exclusif Bord de Cage, cocktail de bienvenue, accès à la zone d'échauffement des athlètes et coupe-file au Complexe d'Ampisikina.",
    specs: ["Siège réservé rang A-B", "Rencontre avec les combattants", "Goodies box incluse"],
    stock: 25
  },
  {
    id: "tkt-mfn3-standard",
    name: "Billet Standard - MFN VOL.3",
    category: "billetterie",
    type: "Accès",
    price: 15000,
    priceLabel: "15 000 Ar",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/affiche%201",
    description: "Accès gradins généraux pour le plus grand gala de la saison à Mahajanga. Placement libre.",
    specs: ["Accès à partir de 16h00", "Zone Gradins Sud/Nord"],
    stock: 450
  },
  {
    id: "pt-club-gold",
    name: "Pack Affiliation Club - Licence Annuelle",
    category: "partenariat",
    type: "Abonnement",
    price: 350000,
    priceLabel: "350 000 Ar / an",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/combattant_2",
    description: "Permet aux clubs d'inscrire officiellement leurs combattants sur la plateforme, d'accéder aux outils d'arbitrage en ligne et de synchroniser leurs galas.",
    specs: ["Profil Club vérifié", "Jusqu'à 50 athlètes enregistrés", "Support technique 7j/7"],
    stock: "Illimité"
  },
  {
    id: "pt-sponsor-event",
    name: "Sponsor Ring / Cage - Visibilité Média",
    category: "partenariat",
    type: "Abonnement",
    price: 1500000,
    priceLabel: "1 500 000 Ar / événement",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/affiche%201",
    description: "Emplacement logo exclusif sur le tapis du ring ou les protections de la cage. Mention speaker toutes les 3 transitions de combat.",
    specs: ["Logo 1mx1m au sol", "30s spot écran géant", "4 invitations VIP incluses"],
    stock: 3
  }
];

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"none" | "payment" | "success">("none");
  const [paymentMethod, setPaymentMethod] = useState<"mvola" | "airtel" | "orange" | "card">("mvola");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const decreaseQuantity = (productId: string) => {
    setCart((prevCart) => 
      prevCart.map(item => {
        if (item.product.id === productId) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const getProductQuantity = (productId: string): number => {
    const found = cart.find(item => item.product.id === productId);
    return found ? found.quantity : 0;
  };

  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const totalItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  const filteredProducts = PRODUCTS_REGISTRY.filter(product => {
    return product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           product.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const triggerCheckoutPayment = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setCheckoutStep("payment");
  };

  const processPaymentFinal = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep("success");
    setCart([]);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-red-600 selection:text-white font-mono antialiased relative pb-24">
      
      {/* HEADER D'INDESY MIALY AVEC TITRE ET DESCRIPTION (FILTRES SUPPRIMÉS) */}
      <div className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-40 shadow-2xl">
        <div className="mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-1.5 max-w-4xl">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="text-red-500 animate-pulse" size={20} />
                <h1 className="text-xl font-black uppercase tracking-tighter text-white">
                  MARKETPLACE
                </h1>
              </div>
              <p className="text-neutral-400 text-xs font-light leading-relaxed">
                Retrouvez vos équipements certifiés et protections homologuées en vente ou location, vos accès exclusifs et billetterie VIP, ainsi que les formules de licences et d'affiliations officielles pour clubs et partenaires.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-8 py-8">

        {/* GRILLE PRINCIPALE DES PRODUITS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const currentQty = getProductQuantity(product.id);
            const isAdded = currentQty > 0;

            return (
              <div 
                key={product.id}
                className="group border border-neutral-800 bg-neutral-900 flex flex-col justify-between rounded-none shadow-xl transition-all duration-300 hover:border-blue-500/40 relative overflow-hidden"
              >
                <div className="absolute top-3 left-3 z-10">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border ${
                    product.type === "Location" 
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                      : product.type === "Abonnement" 
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  }`}>
                    {product.type}
                  </span>
                </div>

                <div className="relative h-48 w-full bg-black/90 overflow-hidden border-b border-neutral-800">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                  />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4 font-mono">
                  {/* Titre, Tarif (Recommandation appliquée ici) et Description */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors uppercase tracking-tight line-clamp-1">
                      {product.name}
                    </h3>
                    
                    {/* Tarif placé juste en bas du titre du produit */}
                    <div className="flex flex-col mb-1">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">Tarif</span>
                      <span className="text-sm font-black text-amber-500 tracking-tight">{product.priceLabel}</span>
                    </div>

                    <p className="text-neutral-400 text-xs font-light leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {product.specs && (
                    <div className="space-y-1 pt-1">
                      {product.specs.slice(0, 2).map((spec, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                          <span className="h-1.5 w-1.5 bg-neutral-700 block shrink-0" />
                          <span className="truncate">{spec}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-neutral-800/80 pt-4 flex items-center justify-between gap-2">
                    {/* Bloc d'action boutons quantité entre - et + */}
                    <div className="flex items-center border border-neutral-800 bg-black shrink-0 overflow-hidden">
                      <button 
                        onClick={() => decreaseQuantity(product.id)}
                        disabled={!isAdded}
                        className={`px-2.5 py-2 text-xs transition-colors ${
                          isAdded ? "text-neutral-400 hover:text-white hover:bg-neutral-900" : "text-neutral-700 cursor-not-allowed"
                        }`}
                      >
                        <Minus size={11} />
                      </button>

                      <button 
                        onClick={() => addToCart(product)}
                        className={`px-3.5 py-2 font-black text-[10px] uppercase tracking-wider transition-all duration-300 border-x border-neutral-800 ${
                          isAdded 
                            ? "bg-amber-500 text-black hover:bg-amber-400" 
                            : "bg-blue-600 text-white hover:bg-blue-500"
                        }`}
                      >
                        {isAdded ? `Ajouté (${currentQty})` : "Ajouter"}
                      </button>

                      <button 
                        onClick={() => addToCart(product)}
                        className="px-2.5 py-2 text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <button 
                      onClick={() => setActiveModalProduct(product)}
                      className="p-2 border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700 transition-colors"
                    >
                      <Info size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECOMMANDATION 3 : PANIER COMPACT EN POSITION FIXE LORS DU SCROLL EN BAS GAUCHE DE L'ÉCRAN */}
      <div className="fixed bottom-6 left-6 z-40">
        <button 
          onClick={() => setIsCartOpen(true)}
          className="text-left border border-blue-500/40 bg-black/95 px-5 py-3 hover:border-blue-400 hover:bg-neutral-900 transition-all rounded-none min-w-[200px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-black tracking-wider text-neutral-200 group-hover:text-white">Mon Panier</span>
            <div className="relative">
              <ShoppingBag size={16} className="text-blue-400" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-2.5 -right-2.5 bg-red-600 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center border border-black rounded-none">
                  {totalItemsCount}
                </span>
              )}
            </div>
          </div>
          <div className="text-[11px] font-bold text-amber-500 tracking-tight mt-1 border-t border-neutral-800/60 pt-1">
            Total : {cartTotal.toLocaleString()} Ar
          </div>
        </button>
      </div>

      {/* RECOMMANDATION 2 : MODALE DU PANIER DÉTAILLÉ (SE FERME SI ON CLIQUE HORS DE LA MODALE) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Zone d'arrière-plan cliquable pour fermer la modale si on clique hors du panier */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          
          {/* Contenu principal du panier (stoppe la propagation du clic) */}
          <div className="relative w-full max-w-md bg-neutral-900 border-l border-neutral-800 p-6 flex flex-col justify-between h-full shadow-2xl rounded-none">
            <div className="space-y-6 flex-1 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag size={18} className="text-amber-500" /> COMMANDE EN COURS ({totalItemsCount})
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20 text-neutral-500 text-xs space-y-2">
                  <ShoppingBag size={20} className="mx-auto text-neutral-800" />
                  <p>Votre panier est vide.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="bg-black/40 border border-neutral-800 p-4 rounded-none flex gap-4 items-start relative group">
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="absolute top-2 right-2 text-neutral-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                      <img src={item.product.image} alt="" className="w-11 h-11 object-cover border border-neutral-800 shrink-0" />
                      
                      <div className="flex-1 font-mono text-xs space-y-1.5 min-w-0">
                        <p className="font-bold text-white truncate uppercase pr-4">{item.product.name}</p>
                        <p className="text-amber-500 font-bold text-[10px]">{item.product.priceLabel}</p>
                        
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center border border-neutral-800 bg-black">
                            <button onClick={() => decreaseQuantity(item.product.id)} className="p-1 text-neutral-400 hover:text-white transition-colors">
                              <Minus size={10} />
                            </button>
                            <span className="px-2 text-[10px] font-bold text-white">{item.quantity}</span>
                            <button onClick={() => addToCart(item.product)} className="p-1 text-neutral-400 hover:text-white transition-colors">
                              <Plus size={10} />
                            </button>
                          </div>
                          <span className="text-white text-[11px] font-bold">
                            {(item.product.price * item.quantity).toLocaleString()} Ar
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-neutral-800 pt-4 mt-6 space-y-4 bg-neutral-900">
                <div className="flex justify-between text-xs font-bold border-b border-neutral-800/40 pb-2">
                  <span className="text-neutral-400 uppercase">Montant total</span>
                  <span className="text-amber-500 text-base font-black">{cartTotal.toLocaleString()} Ar</span>
                </div>
                <button 
                  onClick={triggerCheckoutPayment}
                  className="w-full py-3.5 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-500 transition-all rounded-none flex items-center justify-center gap-2"
                >
                  Passer au paiement sécurisé <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALE FICHE DETAIL PRODUIT */}
      {activeModalProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-none overflow-hidden flex flex-col md:flex-row shadow-2xl">
            <div className="relative md:w-1/2 h-48 md:h-auto bg-black border-b md:border-b-0 md:border-r border-neutral-800">
              <img src={activeModalProduct.image} alt="" className="w-full h-full object-cover opacity-70" />
            </div>
            <div className="p-6 md:w-1/2 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{activeModalProduct.type}</span>
                    <h3 className="text-base font-black uppercase text-white tracking-tight">{activeModalProduct.name}</h3>
                  </div>
                  <button onClick={() => setActiveModalProduct(null)} className="text-neutral-500 hover:text-white transition-colors">
                    <X size={15} />
                  </button>
                </div>
                <p className="text-xs text-neutral-400 font-light leading-relaxed">{activeModalProduct.description}</p>
                {activeModalProduct.specs && (
                  <div className="bg-black/3options border border-neutral-800/80 p-3 space-y-1.5">
                    <p className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Spécifications :</p>
                    <ul className="space-y-1 text-[10px] text-neutral-300">
                      {activeModalProduct.specs.map((spec, i) => (
                        <li key={i} className="flex items-center gap-1.5"><span className="h-1 w-1 bg-red-500" /> {spec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-t border-neutral-800 pt-4 flex items-center justify-between">
                <span className="text-base font-black text-white">{activeModalProduct.priceLabel}</span>
                <button 
                  onClick={() => { addToCart(activeModalProduct); setActiveModalProduct(null); }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-none"
                >
                  Ajouter au Panier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DU TUNNEL DE PAIEMENT */}
      {checkoutStep === "payment" && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={processPaymentFinal} className="w-full max-w-md bg-neutral-900 border border-blue-500/20 p-6 space-y-6 shadow-2xl rounded-none">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={14} className="text-blue-400" /> PASSERELLE DE PAIEMENT EN LIGNE
              </h3>
              <button type="button" onClick={() => setCheckoutStep("none")} className="text-neutral-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="bg-black/40 border border-neutral-800 p-3 flex justify-between items-center text-xs">
              <span className="text-neutral-400 uppercase font-bold">Total à régler :</span>
              <span className="text-amber-500 font-black text-sm">{cartTotal.toLocaleString()} Ar</span>
            </div>
            <div className="space-y-2">
              {/* Les 3 systèmes de paiement Mobile Money sur la même ligne */}
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setPaymentMethod("mvola")} className={`p-3 border text-left flex items-center justify-between rounded-none transition-all ${paymentMethod === "mvola" ? "border-amber-500 bg-amber-500/5 text-white" : "border-neutral-800 bg-black/30 text-neutral-400"}`}>
                  <span className="text-xs font-bold uppercase">Mvola</span>
                  <Smartphone size={14} className={paymentMethod === "mvola" ? "text-amber-500" : "text-neutral-600"} />
                </button>
                <button type="button" onClick={() => setPaymentMethod("airtel")} className={`p-3 border text-left flex items-center justify-between rounded-none transition-all ${paymentMethod === "airtel" ? "border-red-500 bg-red-500/5 text-white" : "border-neutral-800 bg-black/30 text-neutral-400"}`}>
                  <span className="text-xs font-bold uppercase">Airtel</span>
                  <Smartphone size={14} className={paymentMethod === "airtel" ? "text-red-500" : "text-neutral-600"} />
                </button>
                <button type="button" onClick={() => setPaymentMethod("orange")} className={`p-3 border text-left flex items-center justify-between rounded-none transition-all ${paymentMethod === "orange" ? "border-orange-500 bg-orange-500/5 text-white" : "border-neutral-800 bg-black/30 text-neutral-400"}`}>
                  <span className="text-xs font-bold uppercase">Orange</span>
                  <Smartphone size={14} className={paymentMethod === "orange" ? "text-orange-500" : "text-neutral-600"} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block">Numéro de téléphone mobile</label>
              <input type="tel" required placeholder="Ex: 034 XX XX XXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-3 py-3 bg-black/50 border border-neutral-800 text-xs text-white focus:outline-none focus:border-blue-500 rounded-none" />
            </div>
            <div className="bg-black/30 border border-neutral-800/60 p-3 flex gap-2.5 items-start">
              <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={14} />
              <p className="text-[10px] text-neutral-400 font-light leading-snug">Passerelle cryptée sécurisée sous protocole d'intégrité INDESY MIALY.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCheckoutStep("none")} className="w-1/3 py-3 border border-neutral-800 font-bold text-xs text-neutral-400 rounded-none">Annuler</button>
              <button type="submit" className="w-2/3 py-3 bg-red-600 font-bold text-xs uppercase text-white rounded-none">Confirmer</button>
            </div>
          </form>
        </div>
      )}

      {/* MODALE SUCCÈS DU PAIEMENT */}
      {checkoutStep === "success" && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-emerald-500/30 p-8 text-center rounded-none shadow-2xl">
            <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20"><CheckCircle2 size={32} /></div>
            <h3 className="text-lg font-black uppercase text-white tracking-tight">TRANSACTION VALIDÉE AVEC SUCCÈS</h3>
            <p className="text-xs text-neutral-400 font-light max-w-xs mx-auto mt-2">Votre commande a été traitée. Les reçus et bons de validation numériques vous ont été envoyés.</p>
            <button type="button" onClick={() => setCheckoutStep("none")} className="w-full mt-6 py-3 bg-neutral-800 border border-neutral-700 font-bold text-xs uppercase text-white rounded-none">Retour à la boutique</button>
          </div>
        </div>
      )}

    </main>
  );
}