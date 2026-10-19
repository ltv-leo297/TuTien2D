Shader "TrucKhe/PixelSprite"
{
    Properties
    {
        [PerRendererData] _MainTex ("Sprite Texture", 2D) = "white" {}
        _Color ("Tint", Color) = (1,1,1,1)
        [MaterialToggle] PixelSnap ("Pixel snap", Float) = 0
        [HideInInspector] _RendererColor ("RendererColor", Color) = (1,1,1,1)
        [HideInInspector] _Flip ("Flip", Vector) = (1,1,1,1)
        [PerRendererData] _AlphaTex ("External Alpha", 2D) = "white" {}
        [PerRendererData] _EnableExternalAlpha ("Enable External Alpha", Float) = 0
        [PerRendererData] _BendHeight ("Root to crown", Float) = 1
        [PerRendererData] _BendStrength ("Wind strength", Float) = 0
        [PerRendererData] _BendPhase ("Wind phase", Float) = 0
        [PerRendererData] _BendTime ("Wind time", Float) = 0
    }
    SubShader
    {
        Tags { "Queue"="Transparent" "IgnoreProjector"="True" "RenderType"="Transparent" "CanUseSpriteAtlas"="True" }
        Cull Off
        Lighting Off
        ZWrite Off
        Blend One OneMinusSrcAlpha
        Pass
        {
            CGPROGRAM
            #pragma vertex RootedVert
            #pragma fragment SpriteFrag
            #pragma target 2.0
            #pragma multi_compile_instancing
            #pragma multi_compile _ PIXELSNAP_ON
            #pragma multi_compile _ ETC1_EXTERNAL_ALPHA
            #include "UnitySprites.cginc"
            float _BendHeight, _BendStrength, _BendPhase, _BendTime;
            v2f RootedVert(appdata_t v)
            {
                float bend = saturate((v.vertex.y / max(.001, _BendHeight) - .2) / .8);
                v.vertex.x += bend * bend * _BendStrength * (sin(_BendTime * 1.6 + _BendPhase) + .32 * sin(_BendTime * 3.7 + _BendPhase * .7));
                return SpriteVert(v);
            }
            ENDCG
        }
    }
}
