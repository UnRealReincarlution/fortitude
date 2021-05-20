
import { SupabaseClient } from '@supabase/supabase-js'
import clientStyles from '@styles/Home.module.css'
import styles from '@styles/Auth.module.css'
import { createRef, useEffect, useState } from 'react'

import Button from '@components/button'
import Input from '@components/input'
import { Check, FilePlus, Image, Loader, Plus } from 'react-feather';
import { ClientState } from '@public/@types/client'

import Svg from "@public/dashed_border"
import { Loading } from '@supabase/ui'
import { supabase } from '@root/client'

const CreateServerOverlay: React.FC<{ client: SupabaseClient, callback: Function, state: ClientState }> = ({ client, callback, state }) => {
    const [ authState, setAuthState ] = useState('svr-create');
    const [ authInputState, setAuthInputState ] = useState({
        server_name: "",
        server_icon: "",
        server_created: false
    });

    const [ imageDrop, setImageDrop ] = useState({
        dragOver: false,
        droped: false,
        file: null,
        uploading: false,
        uploaded: false
    });

    useEffect(() => {
        if(imageDrop.file) {
            const files = imageDrop.file?.target.files;
            if(!imageDrop.uploaded) setImageDrop({ ...imageDrop, uploaded: true })
        }
    }, [imageDrop])

    const input = createRef();

	return (
		<div className={clientStyles.overlay} onClick={(e) => {
            //@ts-expect-error
            if(e.target.classList.contains(clientStyles.overlay)) callback({ ...state, overlay: { ...state.overlay, createServer: false }});
        }}>
            <div className={styles.authBox}>
                <div className={styles.authLeft}>
                    {
                        (authState == 'svr-create') ?
                        <div className={styles.authLogin}>
                            <div>
                                <h2>Create Server</h2>
                                <h3>Give your server some flair!</h3>
                                <br />
                            </div>
                            
                            <div className={styles.authInput + " " + clientStyles.createServerInput}>
                                <div className={clientStyles.serverIconInputHolder}>
                                    <div 
                                        className={(!imageDrop.dragOver) ? (imageDrop.uploading) ? clientStyles.itemUploading : clientStyles.imageDrop : clientStyles.imageDragging}
                                        // onDragEnter={() => {console.log("DRAGGIG ENTERINGG")}}
                                        onDragOver={() => {setImageDrop({...imageDrop, dragOver: true})}}
                                        onDrop={() => {setImageDrop({...imageDrop, droped: true})}}
                                        //@ts-expect-error
                                        onClick={() => {input.current.click()}}
                                    >
                                        
                                        <div className={clientStyles.createServerImage}>
                                            {
                                                (imageDrop.uploading) ?
                                                    (authInputState.server_created) ?
                                                    <div></div>
                                                    :
                                                    <Check size={32} color={"#fff"} strokeWidth={1}/>
                                                :
                                                <Image size={32} color={"#fff"} strokeWidth={1}/>
                                            }

                                            <div className={clientStyles.createServerImageIMAGE}>
                                                {
                                                    (imageDrop.uploading) ?
                                                        (imageDrop.uploaded) ? 
                                                            (authInputState.server_created) ?
                                                            <div>
                                                                <Check size={32} color={"#fff"} strokeWidth={1}/>
                                                            </div>
                                                            :
                                                            <img src={URL.createObjectURL(imageDrop.file?.target.files.item(0))} alt="" /> 
                                                        :
                                                        //@ts-expect-error
                                                        <Loading active={true} size={32} color={"#fff"} strokeWidth={1}> </Loading>
                                                    :
                                                    <h3>UPLOAD <br /> ICON</h3>
                                                }
                                            </div>
                                            
                                            
                                        </div>
                                        
                                        <input 
                                            type="file" 
                                            hidden={true} 
                                            onChange={(e) => setImageDrop({...imageDrop, file: e, uploading: true})} 
                                            //@ts-expect-error
                                            ref={input}
                                        />
                                    </div>
                                </div>
                                

                                <br />

                                <Input title={"SERVER NAME"} type="email" defaultValue={authInputState.server_name} onChange={(e) => setAuthInputState({ ...authInputState, server_name: e.target.value })}/>
                            </div>

                            <div>
                                <Button title={"Create"} onClick={async (clickEvent, callback) => {
                                    // Create Guild.
                                    client
                                        .from('guilds')
                                        .insert([
                                            {
                                                owner: client.auth.user().id,
                                                name: authInputState.server_name,
                                                iconURL: '',
                                            }
                                        ])
                                        .then((e) => {
                                            console.log(e)
                                            client.storage
                                                .from('server-icons')
                                                .upload(`${e.data[0].id}.${imageDrop.file?.target.files.item(0).name.split('.').pop().toLowerCase()}`, imageDrop.file?.target.files[0])
                                                .catch(e => console.log(e))
                                                .then(_e => {
                                                    // Add the server to the user.
                                                    client
                                                        .from('users')
                                                        .select()
                                                        .eq('id', client.auth.user().id)
                                                        .then((user_data) => {
                                                            client
                                                                .from('users')
                                                                .update([{
                                                                    ...user_data.data[0],
                                                                    servers: [...user_data.data[0].servers, { 
                                                                        id: e.data[0].id,
                                                                        data: { ...e.data[0], iconURL: `${e.data[0].id}.${imageDrop.file?.target.files.item(0).name.split('.').pop().toLowerCase()}` }
                                                                    }]
                                                                }])
                                                                .eq('id', client.auth.user().id)
                                                                .then((e) => {
                                                                    setAuthInputState({ ...authInputState, server_created: true });
                                                                    callback();
                                                                })
                                                        });
                                                    
                                                    // Add the new icon to the guild.
                                                    console.log(e.data[0].id)

                                                    client
                                                        .from('guilds')                                          
                                                        .update([
                                                            {
                                                                id: e.data[0].id,
                                                                owner: client.auth.user().id,
                                                                name: authInputState.server_name,
                                                                iconURL: `${e.data[0].id}.${imageDrop.file?.target.files.item(0).name.split('.').pop().toLowerCase()}`
                                                            }
                                                        ])
                                                        .eq('id', e.data[0].id)
                                                        .then(() => {
                                                            // Server Creation Sucessful
                                                        })
                                                })
                                        })
                                }}/>
                                <p>Have an invite already? <a href="#" onClick={() => setAuthState('svr-join')}>Join Server</a></p> 
                            </div>
                        </div>
                        :
                        <div className={styles.authLogin}>
                            <div>
                                <h2>Create an Account</h2>
                                <h3>We're so excited to see you!</h3>
                            </div>
                            
                            <div className={styles.authSuccess}>
                                <div className={styles.authSuccessCircle}>
                                    <Check color={"white"} size={64}/>
                                </div>
                                
                                <div>
                                    <h1>Success</h1>
                                    <h3>Please verify your email</h3>
                                </div>
                                
                            </div>

                            <div>
                                <p>Havent recieved an email? <a href="#" onClick={() => setAuthState('auth-login')}>Re-send</a></p> 
                            </div>
                        </div>
                    }
                </div>
                
                <div className={styles.authRight}>
                    {
                        //fetch(` https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${client.auth.session().provider_token}`)
                    }
                </div>
            </div> 
        </div>
	)
}

export { CreateServerOverlay }